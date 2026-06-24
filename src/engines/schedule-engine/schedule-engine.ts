// ============================================================
// 溢彩 Production OS — 调度引擎
// 核心职责：人机任务分配、优先级调度、负载均衡
// ============================================================

import { TaskRepository, Task, CreateTaskInput, AssignTaskInput } from '../../domain/task';
import { ProcessRepository } from '../../domain/process';
import { Result, success, failure } from '../../shared/utils';
import { DomainError, ScheduleConflictError } from '../../shared/errors';
import { Priority } from '../../shared/types';

/** 机器型号 */
export interface Machine {
  id: string;
  name: string;
  type: string;
  status: 'idle' | 'running' | 'maintenance';
  currentTaskId?: string;
}

/** 工人 */
export interface Worker {
  id: string;
  name: string;
  skills: string[];
  currentTaskId?: string;
}

/** 调度结果 */
export interface ScheduleResult {
  taskId: string;
  workerId: string;
  machineId: string;
  scheduledAt: string;
}

/** 优先级权重 */
const PRIORITY_WEIGHT: Record<Priority, number> = {
  deadline: 100,
  urgent: 70,
  normal: 40,
  attention: 20,
  unmentioned: 10,
};

export class ScheduleEngine {
  private machines: Machine[] = [];
  private workers: Worker[] = [];

  constructor(
    private readonly taskRepo: TaskRepository,
    private readonly processRepo: ProcessRepository,
  ) {}

  /** 注册机器 */
  registerMachine(machine: Machine): void {
    this.machines.push(machine);
  }

  /** 注册工人 */
  registerWorker(worker: Worker): void {
    this.workers.push(worker);
  }

  /** 获取空闲机器 */
  getIdleMachines(): Machine[] {
    return this.machines.filter(m => m.status === 'idle');
  }

  /** 获取空闲工人 */
  getIdleWorkers(skillRequired?: string): Worker[] {
    return this.workers.filter(w => {
      if (w.currentTaskId) return false;
      if (skillRequired && !w.skills.includes(skillRequired)) return false;
      return true;
    });
  }

  /** 计算任务调度分数 */
  calculateScore(task: Task): number {
    const priorityScore = PRIORITY_WEIGHT[task.priority] ?? PRIORITY_WEIGHT.normal;
    // 等得越久分数越高
    const waitingBonus = task.status === 'queued' ? 10 : 0;
    // 预估工时越短越优先（提高周转率）
    const timeScore = task.estimatedHours > 0 ? Math.min(50, 50 / task.estimatedHours) : 50;
    return priorityScore + waitingBonus + timeScore;
  }

  /** 自动分配任务 */
  async autoAssign(taskId: string): Promise<Result<ScheduleResult, DomainError>> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      return failure(new DomainError(`任务 ${taskId} 不存在`, 'TASK_NOT_FOUND'));
    }

    // 找到合适的空闲机器
    const idleMachines = this.getIdleMachines();
    if (idleMachines.length === 0) {
      return failure(new ScheduleConflictError('all', '没有空闲机器'));
    }
    const machine = idleMachines[0];

    // 找到合适的空闲工人
    const idleWorkers = this.getIdleWorkers(task.processType);
    if (idleWorkers.length === 0) {
      return failure(new ScheduleConflictError(machine.id, `没有可执行${task.processType}的空闲工人`));
    }
    const worker = idleWorkers[0];

    // 执行分配
    const scheduledAt = new Date().toISOString();
    const assignInput: AssignTaskInput = {
      worker: worker.name,
      machineId: machine.id,
      scheduledAt,
    };

    await this.taskRepo.assign(taskId, assignInput);

    // 更新机器和工人状态
    machine.status = 'running';
    machine.currentTaskId = taskId;
    worker.currentTaskId = taskId;

    return success({ taskId, workerId: worker.id, machineId: machine.id, scheduledAt });
  }

  /** 按优先级排序待分配任务 */
  async sortByPriority(tasks: Task[]): Promise<Task[]> {
    return [...tasks].sort((a, b) => this.calculateScore(b) - this.calculateScore(a));
  }

  /** 批量调度 */
  async batchSchedule(): Promise<Result<ScheduleResult[], DomainError>> {
    const queued = await this.taskRepo.findQueued();
    if (queued.length === 0) {
      return success([]);
    }

    const sorted = await this.sortByPriority(queued);
    const results: ScheduleResult[] = [];

    for (const task of sorted) {
      const result = await this.autoAssign(task.id);
      if (result.isSuccess()) {
        results.push(result.value);
      }
    }

    return success(results);
  }

  /** 释放机器（任务完成/失败时） */
  releaseMachine(machineId: string): void {
    const machine = this.machines.find(m => m.id === machineId);
    if (machine) {
      machine.status = 'idle';
      machine.currentTaskId = undefined;
    }
  }

  /** 释放工人 */
  releaseWorker(workerName: string): void {
    const worker = this.workers.find(w => w.name === workerName);
    if (worker) {
      worker.currentTaskId = undefined;
    }
  }

  /** 检查负载（某机器上的排队长） */
  async getMachineLoad(machineId: string): Promise<number> {
    const tasks = await this.taskRepo.findByMachine(machineId, 'running');
    return tasks.length;
  }
}

// ============================================================
// 溢彩 Production OS — 调度引擎
// 核心职责：人机任务分配、优先级调度、负载均衡
// ============================================================

import { TaskRepository, Task } from '../../domain/task';
import { ProcessRepository } from '../../domain/process';
import { Result, success, failure } from '../../shared/utils';
import { DomainError } from '../../shared/errors';
import { Machine, Worker, ScheduleResult } from './types';
import { calculateScore } from './rules/priority-rules';
import { planBatchSchedule } from './planner/schedule-planner';
import {
  findIdleMachines,
  findIdleWorkers,
  autoAssignResources,
  releaseMachine,
  releaseWorker,
} from './allocator/resource-allocator';

export { Machine, Worker, ScheduleResult } from './types';

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
    return findIdleMachines(this.machines);
  }

  /** 获取空闲工人 */
  getIdleWorkers(skillRequired?: string): Worker[] {
    return findIdleWorkers(this.workers, skillRequired);
  }

  /** 计算任务调度分数 */
  calculateScore(task: Task): number {
    return calculateScore(task);
  }

  /** 自动分配任务 */
  async autoAssign(taskId: string): Promise<Result<ScheduleResult, DomainError>> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      return failure(new DomainError(`任务 ${taskId} 不存在`, 'TASK_NOT_FOUND'));
    }

    return autoAssignResources(task, this.machines, this.workers, this.taskRepo);
  }

  /** 按优先级排序待分配任务 */
  async sortByPriority(tasks: Task[]): Promise<Task[]> {
    return [...tasks].sort((a, b) => calculateScore(b) - calculateScore(a));
  }

  /** 批量调度 */
  async batchSchedule(): Promise<Result<ScheduleResult[], DomainError>> {
    const plan = await planBatchSchedule(this.taskRepo);
    if (plan.totalQueued === 0) {
      return success([]);
    }

    const results: ScheduleResult[] = [];

    for (const task of plan.sortedTasks) {
      const result = await this.autoAssign(task.id);
      if (result.isSuccess()) {
        results.push(result.value);
      }
    }

    return success(results);
  }

  /** 释放机器（任务完成/失败时） */
  releaseMachine(machineId: string): void {
    releaseMachine(this.machines, machineId);
  }

  /** 释放工人 */
  releaseWorker(workerName: string): void {
    releaseWorker(this.workers, workerName);
  }

  /** 检查负载（某机器上的排队长） */
  async getMachineLoad(machineId: string): Promise<number> {
    const tasks = await this.taskRepo.findByMachine(machineId, 'running');
    return tasks.length;
  }
}

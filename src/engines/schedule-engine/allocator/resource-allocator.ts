// ============================================================
// 溢彩 Production OS — 资源分配器
// 机器/工人自动分配
// ============================================================

import { Task, AssignTaskInput, TaskRepository } from '../../../domain/task';
import { Result, success, failure } from '../../../shared/utils';
import { DomainError, ScheduleConflictError } from '../../../shared/errors';
import { Machine, Worker, ScheduleResult } from '../types';

/** 查找空闲机器 */
export function findIdleMachines(machines: Machine[]): Machine[] {
  return machines.filter(m => m.status === 'idle');
}

/** 查找空闲工人 */
export function findIdleWorkers(workers: Worker[], skillRequired?: string): Worker[] {
  return workers.filter(w => {
    if (w.currentTaskId) return false;
    if (skillRequired && !w.skills.includes(skillRequired)) return false;
    return true;
  });
}

/** 自动分配任务到机器和工人 */
export async function autoAssignResources(
  task: Task,
  machines: Machine[],
  workers: Worker[],
  taskRepo: TaskRepository,
): Promise<Result<ScheduleResult, DomainError>> {
  // 找到合适的空闲机器
  const idleMachines = findIdleMachines(machines);
  if (idleMachines.length === 0) {
    return failure(new ScheduleConflictError('all', '没有空闲机器'));
  }
  const machine = idleMachines[0];

  // 找到合适的空闲工人
  const idleWorkers = findIdleWorkers(workers, task.processType);
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

  await taskRepo.assign(task.id, assignInput);

  // 更新机器和工人状态
  machine.status = 'running';
  machine.currentTaskId = task.id;
  worker.currentTaskId = task.id;

  return success({ taskId: task.id, workerId: worker.id, machineId: machine.id, scheduledAt });
}

/** 释放机器 */
export function releaseMachine(machines: Machine[], machineId: string): void {
  const machine = machines.find(m => m.id === machineId);
  if (machine) {
    machine.status = 'idle';
    machine.currentTaskId = undefined;
  }
}

/** 释放工人 */
export function releaseWorker(workers: Worker[], workerName: string): void {
  const worker = workers.find(w => w.name === workerName);
  if (worker) {
    worker.currentTaskId = undefined;
  }
}

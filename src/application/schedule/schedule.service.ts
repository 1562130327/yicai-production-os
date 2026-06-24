// ============================================================
// 溢彩 Production OS — 调度应用服务
// ============================================================

import { TaskRepository } from '../../domain/task';
import { ScheduleEngine, ScheduleResult } from '../../engines/schedule-engine';
import { TraceEngine } from '../../engines/trace-engine';
import { Result, success, failure } from '../../shared/utils';
import { DomainError } from '../../shared/errors';

export class ScheduleService {
  constructor(
    private readonly taskRepo: TaskRepository,
    private readonly scheduleEngine: ScheduleEngine,
    private readonly traceEngine: TraceEngine,
  ) {}

  /** 批量调度 */
  async runScheduling(): Promise<Result<ScheduleResult[], DomainError>> {
    const results = await this.scheduleEngine.batchSchedule();

    // 记录每个分配事件
    if (results.isSuccess()) {
      for (const r of results.value) {
        await this.traceEngine.logEvent({
          orderId: r.taskId,
          eventType: 'task_assigned',
          worker: r.workerId,
          machineId: r.machineId,
          metadata: { scheduledAt: r.scheduledAt },
        });
      }
    }

    return results;
  }

  /** 完成任务 */
  async completeTask(taskId: string, completedQty: number): Promise<Result<void, DomainError>> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      return failure(new DomainError(`任务 ${taskId} 不存在`, 'TASK_NOT_FOUND'));
    }

    await this.taskRepo.complete(taskId, completedQty);

    // 释放资源
    if (task.machineId) this.scheduleEngine.releaseMachine(task.machineId);
    if (task.assignedWorker) this.scheduleEngine.releaseWorker(task.assignedWorker);

    await this.traceEngine.logEvent({
      orderId: task.orderId,
      eventType: 'task_completed',
      taskId,
      worker: task.assignedWorker,
      machineId: task.machineId,
      metadata: { completedQty },
    });

    return success(undefined);
  }
}

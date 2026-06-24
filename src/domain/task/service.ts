import { Task } from './task.entity';
import { Priority } from '../order/types';
import { Result, success, failure } from '../../shared/utils';
import { DomainError } from '../../shared/errors';

const PRIORITY_WEIGHT: Record<Priority, number> = {
  deadline: 100, urgent: 70, normal: 40, attention: 20, unmentioned: 10,
};

export class TaskDomainService {
  /** 检查任务是否可分配 */
  canAssign(task: Task): Result<void, DomainError> {
    if (task.status !== 'queued') {
      return failure(new DomainError(`任务 ${task.id} 不在排队状态`, 'TASK_NOT_QUEUED'));
    }
    return success(undefined);
  }

  /** 检查任务是否可完成 */
  canComplete(task: Task): Result<void, DomainError> {
    if (task.status !== 'running') {
      return failure(new DomainError(`任务 ${task.id} 未在执行中`, 'TASK_NOT_RUNNING'));
    }
    return success(undefined);
  }

  /** 计算优先级分数 */
  calculatePriorityScore(task: Task): number {
    const priorityScore = PRIORITY_WEIGHT[task.priority as Priority] ?? 40;
    const waitingBonus = task.status === 'queued' ? 10 : 0;
    const timeScore = task.estimatedHours > 0 ? Math.min(50, 50 / task.estimatedHours) : 50;
    return priorityScore + waitingBonus + timeScore;
  }
}

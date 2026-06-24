// ============================================================
// 溢彩 Production OS — 调度规划器
// 批量调度、任务排序
// ============================================================

import { Task, TaskRepository } from '../../../domain/task';
import { Result, success } from '../../../shared/utils';
import { sortByScore } from '../rules/scoring-rules';

/** 批量调度结果 */
export interface BatchSchedulePlan {
  sortedTasks: Task[];
  totalQueued: number;
}

/** 获取待分配任务并按优先级排序 */
export async function planBatchSchedule(
  taskRepo: TaskRepository,
): Promise<BatchSchedulePlan> {
  const queued = await taskRepo.findQueued();
  const sorted = sortByScore(queued);

  return {
    sortedTasks: sorted,
    totalQueued: queued.length,
  };
}

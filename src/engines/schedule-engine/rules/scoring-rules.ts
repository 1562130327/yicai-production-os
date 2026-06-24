// ============================================================
// 溢彩 Production OS — 评分规则
// 扩展的评分逻辑（可用于更复杂的调度场景）
// ============================================================

import { Task } from '../../../domain/task';
import { calculateScore, PRIORITY_WEIGHT } from './priority-rules';

/** 带权重的综合评分（优先级 + 等待时间 + 工时 + 历史表现） */
export function calculateCompositeScore(
  task: Task,
  factors?: {
    priorityWeight?: number;
    waitingWeight?: number;
    timeWeight?: number;
  },
): number {
  const pw = factors?.priorityWeight ?? 1;
  const ww = factors?.waitingWeight ?? 1;
  const tw = factors?.timeWeight ?? 1;

  const priorityScore = (PRIORITY_WEIGHT[task.priority] ?? PRIORITY_WEIGHT.normal) * pw;
  const waitingBonus = (task.status === 'queued' ? 10 : 0) * ww;
  const timeScore = (task.estimatedHours > 0 ? Math.min(50, 50 / task.estimatedHours) : 50) * tw;

  return priorityScore + waitingBonus + timeScore;
}

/** 按优先级排序任务列表 */
export function sortByScore(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => calculateScore(b) - calculateScore(a));
}

// ============================================================
// 溢彩 Production OS — 优先级规则
// 优先级权重定义和分数计算
// ============================================================

import { Priority } from '../../../shared/types';
import { Task } from '../../../domain/task';

/** 优先级权重 */
export const PRIORITY_WEIGHT: Record<Priority, number> = {
  deadline: 100,
  urgent: 70,
  normal: 40,
  attention: 20,
  unmentioned: 10,
};

/** 计算任务调度分数 */
export function calculateScore(task: Task): number {
  const priorityScore = PRIORITY_WEIGHT[task.priority] ?? PRIORITY_WEIGHT.normal;
  // 等得越久分数越高
  const waitingBonus = task.status === 'queued' ? 10 : 0;
  // 预估工时越短越优先（提高周转率）
  const timeScore = task.estimatedHours > 0 ? Math.min(50, 50 / task.estimatedHours) : 50;
  return priorityScore + waitingBonus + timeScore;
}

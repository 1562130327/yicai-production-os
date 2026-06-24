// ============================================================
// 溢彩 Production OS — 工序状态机
// 控制工序流转的状态转换规则
// ============================================================

import { ProcessStatus } from '../../shared/types';
import { ProcessTransition } from '../../domain/process';
import { InvalidProcessFlowError } from '../../shared/errors';

/** 工序状态转换表 */
export const PROCESS_TRANSITIONS: ProcessTransition[] = [
  { from: 'waiting',  to: 'ready',   event: '上游工序完成', description: '依赖满足，进入就绪' },
  { from: 'ready',    to: 'running', event: '工人开始操作', description: '分配到人机后开始执行' },
  { from: 'running',  to: 'paused',  event: '暂停', description: '异常或主动暂停' },
  { from: 'running',  to: 'done',    event: '操作完成', description: '工序正常完成' },
  { from: 'paused',   to: 'running', event: '恢复', description: '暂停后恢复' },
  { from: 'paused',   to: 'rework',  event: '需要返工', description: '暂停后发现需返工' },
  { from: 'running',  to: 'rework',  event: '品质不合格', description: '质检不合格触发返工' },
  { from: 'rework',   to: 'running', event: '重新开始', description: '返工后重新执行' },
  { from: 'rework',   to: 'done',    event: '返工完成', description: '返工后通过质检' },
  { from: 'ready',    to: 'skipped', event: '跳过工序', description: '当前工序不需要执行' },
  { from: 'waiting',  to: 'skipped', event: '跳过工序', description: '前序条件不满足但允许跳过' },
];

/** 合法转换集合（预计算） */
const VALID_TRANSITIONS = new Map<ProcessStatus, Set<ProcessStatus>>();
for (const t of PROCESS_TRANSITIONS) {
  if (!VALID_TRANSITIONS.has(t.from)) VALID_TRANSITIONS.set(t.from, new Set());
  VALID_TRANSITIONS.get(t.from)!.add(t.to);
}

/** 检查状态转换是否合法 */
export function canTransition(from: ProcessStatus, to: ProcessStatus): boolean {
  return VALID_TRANSITIONS.get(from)?.has(to) ?? false;
}

/** 获取允许的下一状态列表 */
export function getNextStates(current: ProcessStatus): ProcessStatus[] {
  return Array.from(VALID_TRANSITIONS.get(current) ?? []);
}

/** 执行状态转换（带校验） */
export function transition(
  current: ProcessStatus,
  to: ProcessStatus,
  context?: string,
): ProcessStatus {
  if (!canTransition(current, to)) {
    throw new InvalidProcessFlowError(
      context ?? 'unknown',
      current,
      to,
    );
  }
  return to;
}

/** 检查工序是否已终结（完成/跳过即为完结） */
export function isTerminal(status: ProcessStatus): boolean {
  return status === 'done' || status === 'skipped';
}

/** 检查工序是否活跃（running / paused / rework） */
export function isActive(status: ProcessStatus): boolean {
  return status === 'running' || status === 'paused' || status === 'rework';
}

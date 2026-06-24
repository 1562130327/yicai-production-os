// ============================================================
// 溢彩 Production OS — 工序流转规则
// 校验工序状态转换是否合法
// ============================================================

import { ProcessFlow, ProcessStep } from '../../../domain/process';
import { ProcessStatus } from '../../../shared/types';
import { Result, success, failure } from '../../../shared/utils';
import { DomainError } from '../../../shared/errors';
import { canTransition, isTerminal } from './state-machine';

/** 校验工序状态流转是否合法 */
export function validateTransition(
  step: ProcessStep,
  toStatus: ProcessStatus,
  flow: ProcessFlow,
  stepId: string,
): Result<void, DomainError> {
  if (!canTransition(step.status, toStatus)) {
    return failure(
      new DomainError(
        `非法流转: ${step.type} 从 ${step.status} → ${toStatus}`,
        'INVALID_TRANSITION',
        { stepId, from: step.status, to: toStatus },
      ),
    );
  }

  if (toStatus === 'ready') {
    const incomingEdges = flow.edges.filter(e => e.to === stepId);
    const upstreamSteps = flow.steps.filter(s => incomingEdges.some(e => e.from === s.id));
    const allDone = upstreamSteps.every(s => isTerminal(s.status));
    if (!allDone) {
      return failure(
        new DomainError('上游工序未完成，无法就绪', 'UPSTREAM_NOT_DONE', { stepId }),
      );
    }
  }

  return success(undefined);
}

/** 校验工序流输入是否合法 */
export function validateFlowInput(
  steps: ProcessStep[],
  edges: { from: string; to: string }[],
): Result<void, DomainError> {
  if (steps.length === 0) {
    return failure(new DomainError('工艺模板展开后无工序', 'EMPTY_FLOW'));
  }

  // 检查边引用的步骤是否都存在
  const stepIds = new Set(steps.map(s => s.id));
  for (const edge of edges) {
    if (!stepIds.has(edge.from)) {
      return failure(new DomainError(`边引用了不存在的步骤 ${edge.from}`, 'INVALID_EDGE'));
    }
    if (!stepIds.has(edge.to)) {
      return failure(new DomainError(`边引用了不存在的步骤 ${edge.to}`, 'INVALID_EDGE'));
    }
  }

  return success(undefined);
}

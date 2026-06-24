import { ProcessFlow, ProcessStep } from './process.entity';
import { ProcessStatus, ProcessType } from './types';
import { canTransition, isTerminal } from '../../engines/process-engine/rules/state-machine';
import { Result, success, failure } from '../../shared/utils';
import { DomainError } from '../../shared/errors';

export class ProcessDomainService {
  /** 检查工序是否可以推进 */
  canAdvance(step: ProcessStep, toStatus: ProcessStatus): Result<void, DomainError> {
    if (!canTransition(step.status, toStatus)) {
      return failure(new DomainError(
        `非法流转: ${step.type} 从 ${step.status} → ${toStatus}`,
        'INVALID_TRANSITION',
      ));
    }
    return success(undefined);
  }

  /** 检查上游是否全部完成 */
  canStart(flow: ProcessFlow, stepId: string): boolean {
    const incomingEdges = flow.edges.filter(e => e.to === stepId);
    const upstreamSteps = flow.steps.filter(s => incomingEdges.some(e => e.from === s.id));
    return upstreamSteps.every(s => isTerminal(s.status));
  }

  /** 计算工序流进度 */
  calculateProgress(flow: ProcessFlow): { total: number; completed: number; percentage: number } {
    const total = flow.steps.length;
    const completed = flow.steps.filter(s => isTerminal(s.status)).length;
    return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }

  /** 验证工序流输入 */
  validateFlow(flow: ProcessFlow): Result<void, DomainError> {
    if (flow.steps.length === 0) {
      return failure(new DomainError('工序流无步骤', 'EMPTY_FLOW'));
    }
    return success(undefined);
  }
}

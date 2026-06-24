// ============================================================
// 溢彩 Production OS — 异常校验规则
// 校验异常事件的合法性
// ============================================================

import { AnomalyEvent } from '../../../domain/trace';
import { Result, success, failure } from '../../../shared/utils';
import { DomainError } from '../../../shared/errors';

/** 校验异常参数是否合法 */
export function validateAnomalyParams(params: {
  orderId: string;
  processStepId: string;
  type: AnomalyEvent['type'];
  description: string;
  severity: AnomalyEvent['severity'];
}): Result<void, DomainError> {
  if (!params.orderId) {
    return failure(new DomainError('订单ID不能为空', 'INVALID_ORDER_ID'));
  }

  if (!params.processStepId) {
    return failure(new DomainError('工序步骤ID不能为空', 'INVALID_STEP_ID'));
  }

  if (!params.description || params.description.trim().length === 0) {
    return failure(new DomainError('异常描述不能为空', 'EMPTY_DESCRIPTION'));
  }

  return success(undefined);
}

/** 根据异常严重程度判断是否需要触发补产 */
export function shouldTriggerSupplement(
  severity: AnomalyEvent['severity'],
  type: AnomalyEvent['type'],
): boolean {
  // 严重异常或材料问题自动触发补产
  return severity === 'critical' || type === 'shortage';
}

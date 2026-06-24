// ============================================================
// 溢彩 Production OS — 补产触发规则
// 决定是否需要补产、补产数量计算
// ============================================================

import { Result, success, failure } from '../../../shared/utils';
import { DomainError } from '../../../shared/errors';

/** 补产参数 */
export interface SupplementParams {
  originalOrderId: string;
  reason: string;
  quantity: number;
}

/** 校验补产参数 */
export function validateSupplementParams(params: SupplementParams): Result<void, DomainError> {
  if (!params.originalOrderId) {
    return failure(new DomainError('原订单ID不能为空', 'INVALID_ORDER_ID'));
  }

  if (params.quantity <= 0) {
    return failure(new DomainError('补产数量必须大于0', 'INVALID_QUANTITY'));
  }

  if (!params.reason || params.reason.trim().length === 0) {
    return failure(new DomainError('补产原因不能为空', 'EMPTY_REASON'));
  }

  return success(undefined);
}

/** 生成补产订单ID */
export function generateSupplementId(originalOrderId: string): string {
  return `SUP-${originalOrderId}-${Date.now()}`;
}

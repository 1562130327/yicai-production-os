// ============================================================
// 溢彩 Production OS — 材料匹配规则
// 校验材料匹配、库存可用性
// ============================================================

import { MaterialMatch } from '../../../domain/material';
import { InventoryBatch } from '../../../domain/inventory';
import { Result, success, failure } from '../../../shared/utils';
import { DomainError } from '../../../shared/errors';

/** 校验材料匹配结果是否有效 */
export function validateMaterialMatch(
  match: MaterialMatch,
): Result<MaterialMatch, DomainError> {
  if (match.requiredQty <= 0) {
    return failure(new DomainError('需求数量必须大于0', 'INVALID_REQUIRED_QTY'));
  }

  if (match.shortage < 0) {
    return failure(new DomainError('缺口不能为负数', 'INVALID_SHORTAGE'));
  }

  return success(match);
}

/** 校验库存批次是否可用 */
export function validateBatchAvailability(
  batch: InventoryBatch,
  requiredQty: number,
): Result<void, DomainError> {
  if (batch.remainingQty < requiredQty) {
    return failure(
      new DomainError(
        `批次 ${batch.id} 剩余数量 ${batch.remainingQty} 不足（需要 ${requiredQty}）`,
        'BATCH_INSUFFICIENT',
      ),
    );
  }
  return success(undefined);
}

/** 检查多订单是否可合并切割（材料匹配规则） */
export function canMergeOrders(
  orders: Array<{ materialSpec: string; sheetSize: string; sliceSize: string }>,
): boolean {
  if (orders.length < 2) return false;
  const spec = orders[0].materialSpec;
  const sheetSize = orders[0].sheetSize;
  const sliceSize = orders[0].sliceSize;
  return orders.every(
    o => o.materialSpec === spec && o.sheetSize === sheetSize && o.sliceSize === sliceSize,
  );
}

// ============================================================
// 溢彩 Production OS — 批次分配器
// 从可用库存批次中分配材料
// ============================================================

import { InventoryBatch } from '../../../domain/inventory';
import { Result, success, failure } from '../../../shared/utils';
import { DomainError } from '../../../shared/errors';

/** 批次分配结果 */
export interface BatchAllocation {
  batchId: string;
  quantity: number;
}

/** 从可用批次中分配所需数量 */
export function allocateBatches(
  availableBatches: InventoryBatch[],
  requiredQty: number,
): Result<BatchAllocation[], DomainError> {
  if (requiredQty <= 0) {
    return failure(new DomainError('需求数量必须大于0', 'INVALID_REQUIRED_QTY'));
  }

  const allocations: BatchAllocation[] = [];
  let remaining = requiredQty;

  for (const batch of availableBatches) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, batch.remainingQty);
    allocations.push({ batchId: batch.id, quantity: take });
    remaining -= take;
  }

  if (remaining > 0) {
    return failure(
      new DomainError(
        `库存不足：需要 ${requiredQty}，已分配 ${requiredQty - remaining}，还差 ${remaining}`,
        'INSUFFICIENT_INVENTORY',
      ),
    );
  }

  return success(allocations);
}

/** 计算批次总可用量 */
export function totalAvailableQty(batches: InventoryBatch[]): number {
  return batches.reduce((sum, b) => sum + b.remainingQty, 0);
}

import { InventoryBatch } from './inventory.entity';
import { Result, success, failure } from '../../shared/utils';
import { DomainError } from '../../shared/errors';

export class InventoryDomainService {
  /** 检查是否可以扣减 */
  canDeduct(batch: InventoryBatch, quantity: number): Result<void, DomainError> {
    if (batch.remainingQty < quantity) {
      return failure(new DomainError(
        `库存不足: 需要 ${quantity}, 可用 ${batch.remainingQty}`,
        'INSUFFICIENT_STOCK',
      ));
    }
    return success(undefined);
  }

  /** 计算可用库存 */
  calculateAvailability(batches: InventoryBatch[]): number {
    return batches.reduce((sum, b) => sum + b.remainingQty, 0);
  }

  /** 检查是否低于预警线 */
  isLowStock(batch: InventoryBatch, threshold: number = 10): boolean {
    return batch.remainingQty < threshold;
  }
}

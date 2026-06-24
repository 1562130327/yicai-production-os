// ============================================================
// 溢彩 Production OS — 材料应用服务
// ============================================================

import { MaterialRepository, CuttingPlan } from '../../domain/material';
import { InventoryRepository } from '../../domain/inventory';
import { MaterialEngine } from '../../engines/material-engine';
import { mergeOrders, CuttingInput } from '../../engines/material-engine';
import { Result, success, failure } from '../../shared/utils';
import { DomainError } from '../../shared/errors';

export class MaterialService {
  constructor(
    private readonly materialRepo: MaterialRepository,
    private readonly inventoryRepo: InventoryRepository,
    private readonly materialEngine: MaterialEngine,
  ) {}

  /** 查询库存可用量 */
  async getAvailable(spec: string): Promise<Result<number, DomainError>> {
    const total = await this.inventoryRepo.getTotalAvailable(spec);
    return success(total);
  }

  /** 多订单合并切割优化 */
  async optimizeBatch(orders: CuttingInput[]): Promise<Result<CuttingPlan[], DomainError>> {
    if (orders.length === 0) {
      return failure(new DomainError('没有可合并的订单', 'NO_ORDERS'));
    }

    // 检查是否可合并
    if (!this.materialEngine.canMerge(orders)) {
      return failure(
        new DomainError('这些订单规格不同，无法合并切割', 'CANNOT_MERGE'),
      );
    }

    const plans = mergeOrders(orders);
    return success(plans);
  }

  /** 扣减库存 */
  async deductForOrder(
    batchId: string,
    quantity: number,
    orderId: string,
  ): Promise<Result<void, DomainError>> {
    await this.inventoryRepo.deduct({
      batchId,
      quantity,
      orderId,
      reason: `订单 ${orderId} 生产消耗`,
    });

    return success(undefined);
  }
}

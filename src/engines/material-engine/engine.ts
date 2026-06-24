// ============================================================
// 溢彩 Production OS — 材料引擎
// 核心职责：EVA 库存匹配、材料约束校验、损耗计算
// ============================================================

import { MaterialRepository, MaterialMatch } from '../../domain/material';
import { InventoryRepository } from '../../domain/inventory';
import { Result, success, failure } from '../../shared/utils';
import { DomainError, MaterialNotAvailableError } from '../../shared/errors';
import { generateCuttingPlan, CuttingInput } from './planner/cutting-planner';
import { calculateLoss } from './rules/loss-rules';
import { canMergeOrders } from './rules/matching-rules';
import { allocateBatches, totalAvailableQty } from './allocator/batch-allocator';

export class MaterialEngine {
  constructor(
    private readonly materialRepo: MaterialRepository,
    private readonly inventoryRepo: InventoryRepository,
  ) {}

  /** 为订单匹配材料 */
  async matchMaterial(
    materialSpec: string,
    sheetSize: string,
    sliceSize: string,
    sliceQty: number,
  ): Promise<Result<MaterialMatch, DomainError>> {
    // 1. 查找材料定义
    const material = await this.materialRepo.findBySpec(materialSpec);
    if (!material) {
      return failure(new DomainError(`材料 ${materialSpec} 未定义`, 'MATERIAL_NOT_FOUND'));
    }

    // 2. 查找可用库存批次
    const availableBatches = await this.inventoryRepo.findAvailable(materialSpec, 0);
    const availableQty = totalAvailableQty(availableBatches);

    // 3. 计算切割需求（使用材料默认损耗率）
    const plan = generateCuttingPlan({
      materialSpec,
      sheetSize,
      sliceSize,
      sliceQty,
      lossRate: material.lossRate,
      availableBatches: availableBatches.map(b => ({
        batchId: b.id,
        quantity: b.remainingQty,
      })),
    });

    if (!plan) {
      return failure(
        new MaterialNotAvailableError(materialSpec, sliceQty, availableQty),
      );
    }

    const shortage = Math.max(0, plan.totalSheets - availableQty);

    const match: MaterialMatch = {
      materialId: material.id,
      materialSpec,
      requiredQty: plan.totalSheets,
      availableQty,
      shortage,
      matchRate: availableQty > 0 ? Math.min(1, availableQty / plan.totalSheets) : 0,
      suggestedBatches: plan.usedBatches.map(b => b.batchId),
    };

    return success(match);
  }

  /** 计算损耗 */
  loss(
    sheetSize: string,
    sliceSize: string,
    sliceQty: number,
    lossRate: number,
  ): { totalSheets: number; expectedLoss: number; efficiency: number } {
    return calculateLoss(sheetSize, sliceSize, sliceQty, lossRate);
  }

  /** 检查多订单是否可合并切割 */
  canMerge(orders: CuttingInput[]): boolean {
    return canMergeOrders(orders);
  }

  /** 预留库存 */
  async reserveMaterial(
    batchIds: string[],
    orderId: string,
  ): Promise<Result<void, DomainError>> {
    for (const batchId of batchIds) {
      const batch = await this.inventoryRepo.findById(batchId);
      if (!batch) {
        return failure(new DomainError(`批次 ${batchId} 不存在`, 'BATCH_NOT_FOUND'));
      }
    }

    // 记录预留交易
    for (const batchId of batchIds) {
      await this.inventoryRepo.logTransaction({
        batchId,
        type: 'reserved',
        quantity: 0, // 具体数量由切割方案确定
        orderId,
        reason: `订单 ${orderId} 材料预留`,
      });
    }

    return success(undefined);
  }
}

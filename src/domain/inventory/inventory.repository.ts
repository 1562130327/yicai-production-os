// ============================================================
// 溢彩 Production OS — 库存仓储接口
// ============================================================

import { InventoryBatch, InventoryTransaction, DeductInventoryInput } from './inventory.entity';

export interface InventoryRepository {
  /** 按批次ID查找 */
  findById(id: string): Promise<InventoryBatch | null>;

  /** 按材料规格查找可用批次 */
  findByMaterialSpec(spec: string): Promise<InventoryBatch[]>;

  /** 查找有库存的批次 */
  findAvailable(spec: string, minQty: number): Promise<InventoryBatch[]>;

  /** 扣减库存 */
  deduct(input: DeductInventoryInput): Promise<InventoryBatch>;

  /** 入库 */
  inbound(batchId: string, quantity: number, reason: string): Promise<InventoryBatch>;

  /** 释放预留（取消订单时） */
  release(orderId: string, batchId: string, quantity: number): Promise<InventoryBatch>;

  /** 获取总可用量（按规格汇总） */
  getTotalAvailable(spec: string): Promise<number>;

  /** 记录交易 */
  logTransaction(tx: Omit<InventoryTransaction, 'id' | 'timestamp'>): Promise<InventoryTransaction>;

  /** 查询交易历史 */
  getTransactions(batchId: string): Promise<InventoryTransaction[]>;

  /** 创建批次 */
  create(batch: Omit<InventoryBatch, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryBatch>;

  /** 保存 */
  save(batch: InventoryBatch): Promise<InventoryBatch>;
}

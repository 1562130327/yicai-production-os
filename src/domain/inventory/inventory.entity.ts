// ============================================================
// 溢彩 Production OS — 库存领域实体
// 映射自：EVA 库存表
// ============================================================

/** 库存批次 */
export interface InventoryBatch {
  readonly id: string;
  readonly batchNo: string;       // 批次序号
  readonly materialSpec: string;  // 材料规格
  readonly info: string;          // 基础信息
  readonly supplierName: string;  // 供应商
  readonly supplierInfo: string;  // 采购信息
  readonly remainingQty: number;  // 剩余库存
  readonly unit: string;          // 单位
  readonly color: string;         // 颜色
  readonly batchWidth: number;    // 批次幅宽
  readonly price: number;         // 价格
  readonly inboundWeek: number;   // 一周累计入库
  readonly lastInboundAt: string; // 最近入库时间
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** 库存变更记录 */
export interface InventoryTransaction {
  readonly id: string;
  readonly batchId: string;
  readonly type: 'inbound' | 'outbound' | 'reserved' | 'released';
  readonly quantity: number;
  readonly orderId?: string;     // 关联订单（出库时）
  readonly reason: string;
  readonly timestamp: string;
}

/** 库存扣减输入 */
export interface DeductInventoryInput {
  batchId: string;
  quantity: number;
  orderId: string;
  reason: string;
}

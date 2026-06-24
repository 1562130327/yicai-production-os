// ============================================================
// 溢彩 Production OS — 材料领域实体
// 映射自：EVA 库存表
// ============================================================

/** 材料聚合根 */
export interface Material {
  readonly id: string;
  readonly spec: string;         // 材料规格
  readonly info: string;         // 基础信息
  readonly sheetSize: string;    // 片材尺寸
  readonly lossRate: number;     // 损耗率（默认5%）
  readonly unit: string;         // 单位
  readonly color: string;        // 颜色
  readonly materialWidth: number; // 材料幅宽
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** 材料匹配结果 */
export interface MaterialMatch {
  readonly materialId: string;
  readonly materialSpec: string;
  readonly requiredQty: number;      // 需求数量
  readonly availableQty: number;     // 可用数量
  readonly shortage: number;         // 缺口
  readonly matchRate: number;        // 匹配率 (0-1)
  readonly suggestedBatches: string[]; // 建议使用的库存批次
}

/** 切割方案 */
export interface CuttingPlan {
  readonly materialSpec: string;
  readonly sheetSize: string;
  readonly sliceSize: string;
  readonly slicesPerSheet: number;   // 每片材可切片数
  readonly totalSheets: number;      // 所需总片材数
  readonly totalSlices: number;      // 总切片数
  readonly expectedLoss: number;     // 预期损耗（片材数）
  readonly lossRate: number;         // 损耗率
  readonly usedBatches: BatchUsage[]; // 使用的批次
}

/** 批次使用详情 */
export interface BatchUsage {
  readonly batchId: string;
  readonly quantity: number;
}

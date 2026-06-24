// ============================================================
// 溢彩 Production OS — 材料引擎内部类型
// ============================================================

/** 材料匹配参数 */
export interface MaterialMatchParams {
  materialSpec: string;
  sheetSize: string;
  sliceSize: string;
  sliceQty: number;
}

/** 损耗计算参数 */
export interface LossCalculationParams {
  sheetSize: string;
  sliceSize: string;
  sliceQty: number;
  lossRate: number;
}

// ============================================================
// 溢彩 Production OS — 损耗计算规则
// 计算切割损耗、效率
// ============================================================

import { generateCuttingPlan, CuttingInput } from '../planner/cutting-planner';

/** 损耗计算结果 */
export interface LossResult {
  totalSheets: number;
  expectedLoss: number;
  efficiency: number;
}

/** 计算损耗和效率 */
export function calculateLoss(
  sheetSize: string,
  sliceSize: string,
  sliceQty: number,
  lossRate: number,
): LossResult {
  const plan = generateCuttingPlan({
    materialSpec: 'temp',
    sheetSize,
    sliceSize,
    sliceQty,
    lossRate,
    availableBatches: [{ batchId: 'any', quantity: Infinity }],
  });

  if (!plan) {
    return { totalSheets: 0, expectedLoss: 0, efficiency: 0 };
  }

  const theoreticalMinSheets = Math.ceil(sliceQty / plan.slicesPerSheet);
  const efficiency = theoreticalMinSheets / plan.totalSheets;

  return {
    totalSheets: plan.totalSheets,
    expectedLoss: plan.expectedLoss,
    efficiency,
  };
}

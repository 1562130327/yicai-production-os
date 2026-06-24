// ============================================================
// 溢彩 Production OS — 切割优化器
// 核心职责：片材 → 切片计算、损耗优化、多订单合并切割
// ============================================================

import { CuttingPlan, BatchUsage } from '../../../domain/material';

export interface CuttingInput {
  materialSpec: string;
  sheetSize: string;     // 片材尺寸，如 "1200x2400"
  sliceSize: string;     // 切片尺寸，如 "300x400"
  sliceQty: number;      // 需要的切片总数
  lossRate: number;      // 损耗率（如 0.05 = 5%）
  availableBatches: Array<{ batchId: string; quantity: number }>;
}

/** 解析尺寸字符串 */
export function parseSize(size: string): { width: number; height: number } {
  const [w, h] = size.split(/[x×X]/).map(Number);
  return { width: w || 0, height: h || 0 };
}

/** 计算单张片材可切出的切片数量 */
export function slicesPerSheet(sheetSize: string, sliceSize: string): number {
  const sheet = parseSize(sheetSize);
  const slice = parseSize(sliceSize);
  if (!sheet.width || !sheet.height || !slice.width || !slice.height) return 0;

  // 横向可切数 × 纵向可切数
  const horizontalFit = Math.floor(sheet.width / slice.width);
  const verticalFit = Math.floor(sheet.height / slice.height);

  // 也尝试旋转切片方向
  const horizontalFitRotated = Math.floor(sheet.width / slice.height);
  const verticalFitRotated = Math.floor(sheet.height / slice.width);

  return Math.max(
    horizontalFit * verticalFit,
    horizontalFitRotated * verticalFitRotated,
  );
}

/** 生成切割方案 */
export function generateCuttingPlan(input: CuttingInput): CuttingPlan | null {
  const perSheet = slicesPerSheet(input.sheetSize, input.sliceSize);
  if (perSheet <= 0) return null;

  // 理论所需片材数（含损耗），防护 lossRate >= 1
  const safeLossRate = input.lossRate >= 1 ? 0.99 : input.lossRate;
  const withLoss = input.sliceQty / (1 - safeLossRate);
  const totalSheets = Math.ceil(withLoss / perSheet);
  const totalSlices = totalSheets * perSheet;
  const expectedLoss = Math.ceil(totalSheets * input.lossRate);

  // 检查库存是否足够
  const totalAvailable = input.availableBatches.reduce((sum, b) => sum + b.quantity, 0);
  if (totalAvailable < totalSheets) return null;

  // 分配批次
  const usedBatches: BatchUsage[] = [];
  let remaining = totalSheets;
  for (const batch of input.availableBatches) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, batch.quantity);
    usedBatches.push({ batchId: batch.batchId, quantity: take });
    remaining -= take;
  }

  return {
    materialSpec: input.materialSpec,
    sheetSize: input.sheetSize,
    sliceSize: input.sliceSize,
    slicesPerSheet: perSheet,
    totalSheets,
    totalSlices,
    expectedLoss,
    lossRate: input.lossRate,
    usedBatches,
  };
}

/** 多订单合并切割优化 */
export function mergeOrders(
  orders: CuttingInput[],
): CuttingPlan[] {
  // 按材料规格分组
  const bySpec = new Map<string, CuttingInput[]>();
  for (const order of orders) {
    const existing = bySpec.get(order.materialSpec) || [];
    existing.push(order);
    bySpec.set(order.materialSpec, existing);
  }

  const plans: CuttingPlan[] = [];

  for (const [spec, groupedOrders] of bySpec) {
    // 合并同规格订单的切片需求
    const totalQty = groupedOrders.reduce((sum, o) => sum + o.sliceQty, 0);
    const firstOrder = groupedOrders[0];

    // 合并所有可用批次
    const allBatches = new Map<string, number>();
    for (const order of groupedOrders) {
      for (const batch of order.availableBatches) {
        allBatches.set(batch.batchId, (allBatches.get(batch.batchId) ?? 0) + batch.quantity);
      }
    }

    const mergedInput: CuttingInput = {
      materialSpec: spec,
      sheetSize: firstOrder.sheetSize,
      sliceSize: firstOrder.sliceSize,
      sliceQty: totalQty,
      lossRate: firstOrder.lossRate,
      availableBatches: Array.from(allBatches.entries()).map(([batchId, quantity]) => ({
        batchId,
        quantity,
      })),
    };

    const plan = generateCuttingPlan(mergedInput);
    if (plan) plans.push(plan);
  }

  return plans;
}

// ============================================================
// 真实尺寸换算规则（来自工厂）
// ============================================================

/** 厚度取整：54→55, 58→60 */
export function normalizeThickness(mm: number): number {
  if (mm <= 54) return 55;
  if (mm <= 58) return 60;
  return Math.round(mm);
}

/** 标准尺寸换算表（实际可用宽度比标称小） */
export const SIZE_CONVERSION: Record<string, string> = {
  '1m':   '1.05m',
  '1.2m': '1.27m',
  '1.4m': '1.46m',
  '1.5m': '1.55m',
  '3m':   '3.07m',
};

/** 反查标称尺寸 */
export function toStandardSize(size: string): string {
  for (const [std, actual] of Object.entries(SIZE_CONVERSION)) {
    if (size.includes(std)) return size.replace(std, actual);
  }
  return size;
}

/** 浪费容忍度阈值 */
export const WASTE_TOLERANCE: Record<string, number> = {
  '1m':  0.05,   // 1m材料用到950mm可接受
  '1.2m': 0.058,  // 1.2m材料用到1130mm勉强
  '1.4m': 0.057,  // 1.4m材料用到1320mm可接受
};

/** 检查浪费是否可接受 */
export function isWasteAcceptable(nominalSize: string, usedSize: number, actualAvailable: number): { acceptable: boolean; wastePercent: number } {
  const wastePercent = ((actualAvailable - usedSize) / actualAvailable) * 100;
  const threshold = WASTE_TOLERANCE[nominalSize] ? WASTE_TOLERANCE[nominalSize] * 100 : 5;
  return { acceptable: wastePercent <= threshold, wastePercent };
}

/** 切割方案类型 */
export type CutMethod = 'direct' | 'rotate';

export interface CutOption {
  method: CutMethod;
  label: string;
  slicesPerSheet: number;
  totalSheets: number;
  wastePercent: number;
  description: string;
}

/** 生成两种切割方案供师傅选择 */
export function generateCutOptions(
  sheetSize: string,
  sliceSize: string,
  sliceQty: number,
  lossRate: number,
): CutOption[] {
  const sheet = parseSize(sheetSize);
  const slice = parseSize(sliceSize);
  if (!sheet.width || !sheet.height || !slice.width || !slice.height) return [];

  const options: CutOption[] = [];

  // 方案1：直接切
  const directH = Math.floor(sheet.width / slice.width);
  const directV = Math.floor(sheet.height / slice.height);
  const directPerSheet = directH * directV;

  if (directPerSheet > 0) {
    const safeLR = lossRate >= 1 ? 0.99 : lossRate;
    const directSheets = Math.ceil(sliceQty / (directPerSheet * (1 - safeLR)));
    options.push({
      method: 'direct',
      label: '直接切',
      slicesPerSheet: directPerSheet,
      totalSheets: directSheets,
      wastePercent: ((sheet.width * sheet.height - directH * slice.width * directV * slice.height) / (sheet.width * sheet.height)) * 100,
      description: `横向${directH}×纵向${directV}=${directPerSheet}片/张，需${directSheets}张`,
    });
  }

  // 方案2：旋转90度切（套料切）
  const rotateH = Math.floor(sheet.width / slice.height);
  const rotateV = Math.floor(sheet.height / slice.width);
  const rotatePerSheet = rotateH * rotateV;

  if (rotatePerSheet > 0 && rotatePerSheet !== directPerSheet) {
    const safeLR2 = lossRate >= 1 ? 0.99 : lossRate;
    const rotateSheets = Math.ceil(sliceQty / (rotatePerSheet * (1 - safeLR2)));
    options.push({
      method: 'rotate',
      label: '套料切（旋转90°）',
      slicesPerSheet: rotatePerSheet,
      totalSheets: rotateSheets,
      wastePercent: ((sheet.width * sheet.height - rotateH * slice.height * rotateV * slice.width) / (sheet.width * sheet.height)) * 100,
      description: `旋转后横向${rotateH}×纵向${rotateV}=${rotatePerSheet}片/张，需${rotateSheets}张（省料但慢）`,
    });
  }

  return options;
}

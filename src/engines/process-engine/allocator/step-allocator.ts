// ============================================================
// 溢彩 Production OS — 工序步骤分配器
// 确定各工序的需求数量并生成工序步骤
// ============================================================

import { ProcessStep, CreateProcessInput } from '../../../domain/process';
import { ProcessType, ProcessStatus } from '../../../shared/types';
import { PROCESS_ORDER } from '../types';
import { v4 as uuid } from 'uuid';

/** 根据工序类型计算需求数量 */
function stepRequiredQty(type: ProcessType, input: CreateProcessInput): number | undefined {
  switch (type) {
    case '横竖分切': case '破片': return undefined; // 片材数由师傅判断
    case '直切': return input.sliceQty > 0 ? input.sliceQty : undefined;
    case '冲型': return (input.punchQty ?? 0) > 0 ? input.punchQty : undefined;
    default: return (input.punchQty ?? input.sliceQty ?? 0) > 0 ? (input.punchQty ?? input.sliceQty) : undefined;
  }
}

/** 生成工序步骤列表（排序 + 分配参数） */
export function allocateStepQuantities(
  types: ProcessType[],
  input: CreateProcessInput,
): ProcessStep[] {
  // 按执行顺序排序
  const sortedTypes = [...types].sort(
    (a, b) => (PROCESS_ORDER[a] ?? 99) - (PROCESS_ORDER[b] ?? 99),
  );

  return sortedTypes.map((type, idx) => ({
    id: uuid(),
    type,
    name: `${type}`,
    sequence: idx + 1,
    status: 'waiting' as ProcessStatus,
    completedQty: 0,
    requiredQty: stepRequiredQty(type, input),
    // 材料约束只给第一步
    requiredMaterialSpec: idx === 0 ? input.materialSpec : undefined,
    requiredSheetSize: idx === 0 ? input.sheetSize : undefined,
    // 切割参数
    sliceSize: ['横竖分切', '破片', '直切'].includes(type) ? input.sliceSize : undefined,
    sliceQty: ['横竖分切', '破片', '直切'].includes(type) ? input.sliceQty : undefined,
    // 冲型参数
    punchType: type === '冲型' ? input.punchType : undefined,
    punchQty: type === '冲型' ? input.punchQty : undefined,
  }));
}

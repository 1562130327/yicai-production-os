// ============================================================
// 溢彩 Production OS — 追溯查询规划器
// 规划追溯查询路径
// ============================================================

/** 追溯查询类型 */
export type TraceQueryType = 'byOrder' | 'byBatch' | 'byProcess';

/** 追溯查询计划 */
export interface TraceQueryPlan {
  queryType: TraceQueryType;
  targetId: string;
  includeMetadata: boolean;
}

/** 创建追溯查询计划 */
export function planTraceQuery(
  queryType: TraceQueryType,
  targetId: string,
  options?: { includeMetadata?: boolean },
): TraceQueryPlan {
  return {
    queryType,
    targetId,
    includeMetadata: options?.includeMetadata ?? false,
  };
}

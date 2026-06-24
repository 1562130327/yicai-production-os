// ============================================================
// 溢彩 Production OS — DAG 构建器
// 构建工序之间的线性依赖边
// ============================================================

import { ProcessStep, ProcessEdge } from '../../../domain/process';

/** 构建线性依赖 DAG（顺序链） */
export function buildLinearDag(steps: ProcessStep[]): ProcessEdge[] {
  const edges: ProcessEdge[] = [];
  for (let i = 1; i < steps.length; i++) {
    edges.push({
      from: steps[i - 1].id,
      to: steps[i].id,
      condition: `${steps[i - 1].type} → ${steps[i].type}`,
    });
  }
  return edges;
}

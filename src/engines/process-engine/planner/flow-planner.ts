// ============================================================
// 溢彩 Production OS — 工序流规划器
// 从工艺模板展开原子工序
// ============================================================

import { CreateProcessInput } from '../../../domain/process';
import { ProcessType, PROCESS_TEMPLATE_MAP } from '../../../shared/types';
import { Result, success, failure } from '../../../shared/utils';
import { DomainError } from '../../../shared/errors';

/** 从工艺模板展开原子工序列表 */
export function expandTemplate(
  input: CreateProcessInput,
): Result<ProcessType[], DomainError> {
  // 1. 从模板展开原子工序（优先数据库，常量后备）
  let types: ProcessType[] = [];
  try {
    const row = (input as any).db?.prepare?.('SELECT steps FROM process_templates WHERE name = ?')?.get(input.template) as any;
    if (row) types = JSON.parse(row.steps);
  } catch {}
  if (!types.length) types = [...(PROCESS_TEMPLATE_MAP[input.template] ?? [])];

  // 2. 处理增删
  if (input.removeSteps) {
    types = types.filter(t => !input.removeSteps!.includes(t));
  }
  if (input.extraSteps) {
    types.push(...input.extraSteps);
  }

  if (types.length === 0) {
    return failure(new DomainError('工艺模板展开后无工序', 'EMPTY_TEMPLATE', { template: input.template }));
  }

  return success(types);
}

// ============================================================
// 溢彩 Production OS — 工序 DTO
// ============================================================

import { z } from 'zod';

export const AdvanceStepSchema = z.object({
  flowId: z.string().min(1),
  stepId: z.string().min(1),
  toStatus: z.enum(['ready', 'running', 'paused', 'done', 'rework', 'skipped']),
});

export const ReworkStepSchema = z.object({
  flowId: z.string().min(1),
  stepId: z.string().min(1),
  reason: z.string().min(1, '返工原因不能为空'),
});

export type AdvanceStepDTO = z.infer<typeof AdvanceStepSchema>;
export type ReworkStepDTO = z.infer<typeof ReworkStepSchema>;

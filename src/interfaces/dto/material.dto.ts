// ============================================================
// 溢彩 Production OS — 材料 DTO
// ============================================================

import { z } from 'zod';

export const MaterialMatchSchema = z.object({
  materialSpec: z.string().min(1),
  sheetSize: z.string().min(1),
  sliceSize: z.string().min(1),
  sliceQty: z.number().int().positive(),
});

export const DeductInventorySchema = z.object({
  batchId: z.string().min(1),
  quantity: z.number().int().positive(),
  orderId: z.string().min(1),
});

export const CreateInventorySchema = z.object({
  supplier: z.string().min(1),
  material: z.string().min(1),
  color: z.string().optional().default(''),
  width: z.number().positive(),
  length: z.number().positive(),
  thickness: z.number().positive(),
  quantity: z.number().int().positive(),
  price: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export type MaterialMatchDTO = z.infer<typeof MaterialMatchSchema>;
export type DeductInventoryDTO = z.infer<typeof DeductInventorySchema>;

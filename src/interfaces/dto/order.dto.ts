// ============================================================
// 溢彩 Production OS — 订单 DTO（数据传输对象）
// ============================================================

import { z } from 'zod';
import { CreateOrderInput } from '../../domain/order';

export const CreateOrderSchema = z.object({
  code: z.string().min(1, '订单编号不能为空'),
  productCode: z.string().min(1, '款号不能为空'),
  customerName: z.string().min(1, '客户名称不能为空'),
  category: z.string().min(1, '类别不能为空'),
  processTemplate: z.enum([
    '片材', '片材切片', '片材冲型', '片材切片冲型', '切片冲型',
    '片材背胶', '片材背胶冲型', '片材背胶切片', '片材背胶切片冲型',
    '片材贴布', '片材贴布冲型', '片材贴布切片', '片材贴布切片冲型',
    '片材背胶贴布', '片材背胶贴布冲型', '片材背胶贴布切片冲型',
    '片材切片冲型点胶', '片材贴布切片冲型点胶',
    '库存片材', '库存切片', '库存冲型', '库存切片冲型',
    '改回填', '热熔胶', '点胶', '打包',
  ]),
  priority: z.enum(['deadline', 'urgent', 'normal', 'attention', 'unmentioned']).optional().default('normal'),
  materialSpec: z.string().min(1, '材料规格不能为空'),
  sheetSize: z.string().min(1, '片材尺寸不能为空'),
  sliceSize: z.string().min(1, '切片尺寸不能为空'),
  sliceQty: z.number().int().positive('切片总数必须 > 0'),
  punchType: z.enum(['单冲', '连冲', '复合冲']).optional(),
  punchQty: z.number().int().positive().optional(),
  dimensions: z.array(z.object({
    sliceSize: z.string().optional(),
    sliceQty: z.number().int().positive().optional(),
    punchSize: z.string().optional(),
    punchQty: z.number().int().positive().optional(),
  })).optional().default([]),
});

export type CreateOrderDTO = z.infer<typeof CreateOrderSchema>;

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'material_matching', 'scheduled', 'in_progress', 'partial_done', 'completed', 'cancelled']),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// ============================================================
// 溢彩 Production OS — 订单路由
// ============================================================

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { CreateOrderSchema, UpdateOrderStatusSchema, PaginationSchema } from '../../dto';
import { OrderService } from '../../../application/order';
import { requireRole } from '../middleware/auth';

export function createOrderRoutes(orderService: OrderService): Router {
  const router = Router();

  /** POST /api/orders — 创建订单（跟单员/管理员） */
  router.post('/', requireRole('admin', 'merchandiser'), asyncHandler(async (req: Request, res: Response) => {
    const dto = CreateOrderSchema.parse(req.body);
    const result = await orderService.createOrder(dto);
    if (result.isFailure()) { res.status(400).json({ success: false, error: result.error }); return; }
    res.status(201).json({ success: true, data: result.value });
  }));

  /** GET /api/orders/:id — 获取订单详情 */
  router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const result = await orderService.getOrder(req.params.id);
    if (result.isFailure()) { res.status(404).json({ success: false, error: result.error }); return; }
    res.json({ success: true, data: result.value });
  }));

  /** GET /api/orders — 获取活跃订单列表 */
  router.get('/', asyncHandler(async (_req: Request, res: Response) => {
    const result = await orderService.getActiveOrders();
    if (result.isFailure()) { res.status(400).json({ success: false, error: result.error }); return; }
    res.json({ success: true, data: result.value });
  }));

  /** PUT /api/orders/:id/assign — 管理员分配订单 pending→scheduled */
  router.put('/:id/assign', requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
    const result = await orderService.getOrder(req.params.id);
    if (result.isFailure() || result.value.status !== 'pending') {
      res.status(400).json({ success: false, error: '订单不存在或状态不是待排产' }); return;
    }
    const updated = await orderService.updateStatus(req.params.id, 'scheduled');
    res.json({ success: true, data: updated });
  }));

  /** PUT /api/orders/:id/complete — 完单 */
  router.put('/:id/complete', asyncHandler(async (req: Request, res: Response) => {
    const result = await orderService.completeOrder(req.params.id);
    if (result.isFailure()) { res.status(400).json({ success: false, error: result.error }); return; }
    res.json({ success: true, data: result.value });
  }));

  return router;
}

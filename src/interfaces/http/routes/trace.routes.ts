// ============================================================
// 溢彩 Production OS — 追溯路由
// ============================================================

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { TraceService } from '../../../application/trace';

export function createTraceRoutes(traceService: TraceService): Router {
  const router = Router();

  /** GET /api/traces/:orderId — 获取订单完整追溯链 */
  router.get('/:orderId', asyncHandler(async (req: Request, res: Response) => {
    const result = await traceService.getOrderTrace(req.params.orderId);

    if (result.isFailure()) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }

    res.json({ success: true, data: result.value });
  }));

  /** GET /api/traces/batch/:batchId — 材料批次反查 */
  router.get('/batch/:batchId', asyncHandler(async (req: Request, res: Response) => {
    const result = await traceService.traceByBatch(req.params.batchId);

    if (result.isFailure()) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }

    res.json({ success: true, data: result.value });
  }));

  /** POST /api/traces/anomaly — 报告异常 */
  router.post('/anomaly', asyncHandler(async (req: Request, res: Response) => {
    const { orderId, processStepId, type, description, severity } = req.body;
    const result = await traceService.reportAnomaly({
      orderId,
      processStepId,
      type,
      description,
      severity,
    });

    if (result.isFailure()) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }

    res.status(201).json({ success: true, data: result.value });
  }));

  /** POST /api/traces/supplement — 创建补产 */
  router.post('/supplement', asyncHandler(async (req: Request, res: Response) => {
    const { originalOrderId, reason, quantity } = req.body;
    const result = await traceService.supplement({ originalOrderId, reason, quantity });

    if (result.isFailure()) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }

    res.status(201).json({ success: true, data: result.value });
  }));

  return router;
}

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { AdvanceStepSchema, ReworkStepSchema } from '../../dto';
import { ProcessService } from '../../../application/process';

export function createProcessRoutes(processService: ProcessService): Router {
  const router = Router();

  router.get('/:orderId', asyncHandler(async (req: Request, res: Response) => {
    const result = await processService.getFlow(req.params.orderId);
    if (result.isFailure()) { res.status(404).json({ success: false, error: result.error }); return; }
    res.json({ success: true, data: result.value });
  }));

  router.put('/advance', asyncHandler(async (req: Request, res: Response) => {
    const dto = AdvanceStepSchema.parse(req.body);
    let result;
    if (dto.toStatus === 'running') result = await processService.startStep(dto.flowId, dto.stepId);
    else if (dto.toStatus === 'done') result = await processService.completeStep(dto.flowId, dto.stepId);
    else result = await processService.advanceStep(dto.flowId, dto.stepId, dto.toStatus);
    if (result.isFailure()) { res.status(400).json({ success: false, error: result.error }); return; }
    res.json({ success: true, data: null });
  }));

  router.put('/rework', asyncHandler(async (req: Request, res: Response) => {
    const dto = ReworkStepSchema.parse(req.body);
    const result = await processService.reworkStep(dto.flowId, dto.stepId, dto.reason);
    if (result.isFailure()) { res.status(400).json({ success: false, error: result.error }); return; }
    res.json({ success: true, data: null });
  }));

  router.post('/complete', asyncHandler(async (req: Request, res: Response) => {
    const { flowId, stepId, quantity, worker, defectQty, notes } = req.body;
    if (!flowId || !stepId || !quantity || !worker) {
      res.status(400).json({ success: false, error: '缺少必填字段: flowId, stepId, quantity, worker' });
      return;
    }

    const result = await processService.recordCompletion(flowId, stepId, { quantity, worker, defectQty, notes });
    if (result.isFailure()) { res.status(400).json({ success: false, error: result.error }); return; }

    const { step, isComplete, shortfall, supplementChain } = result.value;
    const progress = step.requiredQty ? `${step.completedQty}/${step.requiredQty}` : `${step.completedQty}`;

    let message = isComplete
      ? `${step.type} 已完成!`
      : `${step.type} 进度: ${progress}`;

    if (shortfall > 0) {
      message += ` | 缺口: ${shortfall}`;
    }
    if (supplementChain.length > 0) {
      message += ` | 已通知补产: ${supplementChain.map((s: any) => s.type).join(' → ')}`;
    }

    res.json({
      success: true,
      data: { step, isComplete, shortfall, supplementChain, message },
    });
  }));

  return router;
}

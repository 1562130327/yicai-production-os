import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { TraceEngine } from '../../../engines/trace-engine';
import { ProcessEngine } from '../../../engines/process-engine';

export function createFeedbackRoutes(traceEngine: TraceEngine, processEngine: ProcessEngine): Router {
  const router = Router();

  /** POST /api/feedback — 提交反馈（自动暂停当前工序） */
  router.post('/', asyncHandler(async (req: Request, res: Response) => {
    const { orderId, processStepId, flowId, type, description, severity } = req.body;

    if (!orderId || !processStepId || !type || !description) {
      res.status(400).json({ success: false, error: '缺少必填字段' });
      return;
    }

    const validTypes = ['material_quality', 'machine_failure', 'staff_shortage', 'other'];
    if (!validTypes.includes(type)) {
      res.status(400).json({ success: false, error: `反馈类型无效，可选: ${validTypes.join(', ')}` });
      return;
    }

    // 自动暂停工序
    let paused = false;
    if (flowId && processStepId) {
      const result = await processEngine.advanceStep(flowId, processStepId, 'paused');
      paused = result.isSuccess();
    }

    // 记录异常
    const anomaly = await traceEngine.reportAnomaly({
      orderId,
      processStepId,
      type,
      description,
      severity: severity || 'medium',
      triggerSupplement: false,
    });

    // 记录追溯
    await traceEngine.logEvent({
      orderId,
      eventType: 'anomaly_detected',
      metadata: {
        feedbackType: type,
        description,
        severity,
        stepPaused: paused,
        timestamp: new Date().toISOString(),
      },
    });

    const typeLabels: Record<string, string> = {
      material_quality: '材料质量',
      machine_failure: '机器故障',
      staff_shortage: '人员不足',
      other: '其他',
    };

    res.status(201).json({
      success: true,
      data: {
        anomaly: anomaly.isSuccess() ? anomaly.value : null,
        stepPaused: paused,
        message: paused
          ? `${typeLabels[type]}反馈已提交，工序已暂停，已通知管理员`
          : `${typeLabels[type]}反馈已提交`,
      },
    });
  }));

  /** POST /api/feedback/:anomalyId/resolve — 管理员处理反馈 */
  router.post('/:anomalyId/resolve', asyncHandler(async (req: Request, res: Response) => {
    // 记录追溯（管理员处理）
    await traceEngine.logEvent({
      orderId: req.body.orderId || 'unknown',
      eventType: 'anomaly_detected',
      metadata: {
        resolved: true,
        anomalyId: req.params.anomalyId,
        resolution: req.body.resolution || '',
        timestamp: new Date().toISOString(),
      },
    });

    res.json({
      success: true,
      data: { message: '反馈已处理，工序可恢复' },
    });
  }));

  return router;
}

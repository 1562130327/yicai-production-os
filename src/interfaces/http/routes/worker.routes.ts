import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { OrderService } from '../../../application/order';
import { ProcessService } from '../../../application/process';
import { PROCESS_WORKER_MAP, PROCESS_MACHINE_MAP, PRIORITY_LABELS, PRIORITY_COLORS } from '../../../shared/types';
import type { ProcessType } from '../../../shared/types';

export function createWorkerRoutes(orderService: OrderService, processService: ProcessService): Router {
  const router = Router();

  /** GET /api/workers/:name/tasks — 获取师傅的所有任务 */
  router.get('/:name/tasks', asyncHandler(async (req: Request, res: Response) => {
    const worker = req.params.name;
    const ordersResult = await orderService.getActiveOrders();
    if (ordersResult.isFailure()) {
      res.status(400).json({ success: false, error: ordersResult.error });
      return;
    }

    const orders = ordersResult.value;
    const tasks: any[] = [];

    for (const order of orders) {
      if (order.status === 'completed' || order.status === 'cancelled') continue;

      const flowResult = await processService.getFlow(order.id);
      if (flowResult.isFailure()) continue;
      const flow = flowResult.value;

      const mySteps = flow.steps.filter(s => PROCESS_WORKER_MAP[s.type] === worker);
      for (const step of mySteps) {
        // 按师傅角色显示不同规格
        let spec = '';
        switch (step.type as ProcessType) {
          case '横竖分切': spec = order.materialSpec; break;
          case '破片': spec = order.sheetSize; break;
          case '直切': spec = `${step.sliceSize || order.sliceSize} × ${step.sliceQty || order.sliceQty}片`; break;
          case '冲型': spec = `${step.punchType || ''} ${step.punchQty || order.punchQty || ''}个`; break;
          case '背胶': case '点胶': case '贴布': spec = `${step.punchQty || step.sliceQty || order.punchQty || ''}个`; break;
          case '打包': spec = `${step.punchQty || order.punchQty || step.sliceQty || order.sliceQty || ''}个`; break;
          default: spec = `${step.requiredQty || ''}`;
        }

        tasks.push({
          orderId: order.id,
          orderCode: order.code,
          customer: order.customerName,
          productCode: order.productCode,
          processTemplate: order.processTemplate,
          priority: order.priority,
          priorityLabel: PRIORITY_LABELS[order.priority] || order.priority,
          priorityColor: PRIORITY_COLORS[order.priority] || '#999',
          orderStatus: order.status,
          flowId: flow.id,
          stepId: step.id,
          stepType: step.type,
          stepStatus: step.status,
          stepSequence: step.sequence,
          totalSteps: flow.steps.length,
          spec,
          requiredQty: step.requiredQty,
          completedQty: step.completedQty,
          machine: PROCESS_MACHINE_MAP[step.type] || '',
          materialSpec: order.materialSpec,
          sheetSize: order.sheetSize,
          sliceSize: step.sliceSize,
          sliceQty: step.sliceQty,
          punchQty: step.punchQty,
        });
      }
    }

    // 排序：急单优先，同优先级按状态排序
    const prioOrder = { deadline: 5, urgent: 4, normal: 3, attention: 2, unmentioned: 1 };
    tasks.sort((a, b) => {
      const pa = prioOrder[a.priority as keyof typeof prioOrder] || 0;
      const pb = prioOrder[b.priority as keyof typeof prioOrder] || 0;
      if (pa !== pb) return pb - pa;
      // 运行中的排前
      if (a.stepStatus === 'running' && b.stepStatus !== 'running') return -1;
      if (b.stepStatus === 'running' && a.stepStatus !== 'running') return 1;
      return 0;
    });

    res.json({
      success: true,
      data: {
        worker,
        count: tasks.length,
        running: tasks.filter(t => t.stepStatus === 'running').length,
        waiting: tasks.filter(t => t.stepStatus === 'waiting' || t.stepStatus === 'ready').length,
        tasks,
      },
    });
  }));

  return router;
}

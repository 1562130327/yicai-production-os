import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { OrderService } from '../../../application/order';
import { ProcessService } from '../../../application/process';
import { PROCESS_WORKER_MAP, PROCESS_MACHINE_MAP, PRIORITY_LABELS } from '../../../shared/types';
import type { ProcessType } from '../../../shared/types';

export function createPrintRoutes(orderService: OrderService, processService: ProcessService): Router {
  const router = Router();

  router.get('/:workerName', asyncHandler(async (req: Request, res: Response) => {
    const worker = req.params.workerName;
    const ordersResult = await orderService.getActiveOrders();
    if (ordersResult.isFailure()) {
      res.status(400).json({ success: false, error: ordersResult.error });
      return;
    }

    const orders = ordersResult.value;
    const tasks: any[] = [];

    for (const order of orders) {
      try {
        const flowResult = await processService.getFlow(order.id);
        if (flowResult.isFailure()) continue;
        const flow = flowResult.value;
        const mySteps = flow.steps.filter(s => PROCESS_WORKER_MAP[s.type] === worker);
        if (mySteps.length === 0) continue;

        for (const step of mySteps) {
          let spec = '';
          switch (step.type as ProcessType) {
            case '横竖分切': spec = step.requiredMaterialSpec || ''; break;
            case '破片': spec = step.requiredSheetSize || step.sliceSize || ''; break;
            case '直切': spec = `${step.sliceSize || ''} x ${step.sliceQty || ''}`; break;
            case '冲型': spec = `${step.punchType || ''} ${step.punchQty || ''}`; break;
            default: spec = `${step.punchQty || step.sliceQty || ''}`;
          }
          tasks.push({
            orderCode: order.code,
            customer: order.customerName,
            processType: step.type,
            status: step.status,
            priority: order.priority,
            spec,
            quantity: step.requiredQty || step.punchQty || step.sliceQty || 0,
            completedQty: step.completedQty,
            machine: PROCESS_MACHINE_MAP[step.type] || '',
          });
        }
      } catch {}
    }

    // 郑思远：待生产排前；其他师傅：生产中排前
    if (worker === '郑思远') {
      tasks.sort((a, b) => (a.status === 'running' ? 1 : -1));
    } else {
      tasks.sort((a, b) => (a.status === 'running' ? -1 : 1));
    }

    const rows = tasks.map((t: any) => `<tr class="${t.status}">
<td>${t.orderCode}</td><td>${t.customer}</td><td>${t.processType}</td>
<td>${t.spec}</td><td>${t.quantity}</td><td>${t.completedQty}</td>
<td>${t.machine}</td><td class="priority-${t.priority}">${PRIORITY_LABELS[t.priority as keyof typeof PRIORITY_LABELS] || t.priority}</td>
</tr>`).join('');

    const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>${worker} 任务单</title>
<style>@media print{body{width:100%;margin:0;padding:10px}}
body{font-family:'Microsoft YaHei',sans-serif;font-size:13px;color:#333;max-width:800px;margin:0 auto}
h1{font-size:18px;border-bottom:2px solid #333;padding-bottom:8px}
table{width:100%;border-collapse:collapse;margin:10px 0}
th,td{border:1px solid #999;padding:6px 8px;text-align:left;font-size:12px}
th{background:#eee}
.priority-deadline{color:#c00;font-weight:bold}
.priority-urgent{color:#e60}
.running{background:#fff3e0}
.waiting{background:#f5f5f5}
.print-btn{position:fixed;top:10px;right:10px;padding:8px 16px;background:#4fc3f7;border:none;color:#000;border-radius:4px;cursor:pointer;font-size:14px}
@media print{.print-btn{display:none}}
</style></head><body>
<button class="print-btn" onclick="window.print()">🖨 打印</button>
<h1>${worker} 任务单</h1>
<p>打印时间: ${new Date().toLocaleString('zh-CN')} | 任务数: ${tasks.length}</p>
<table><thead><tr><th>订单号</th><th>客户</th><th>工序</th><th>规格</th><th>数量</th><th>完成</th><th>机器</th><th>优先级</th></tr></thead><tbody>
${rows}
</tbody></table></body></html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }));

  return router;
}

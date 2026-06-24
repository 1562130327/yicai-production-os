import { Express } from 'express';
import { createOrderRoutes } from './order.routes';
import { createProcessRoutes } from './process.routes';
import { createMaterialRoutes } from './material.routes';
import { createTraceRoutes } from './trace.routes';
import { createFeedbackRoutes } from './feedback.routes';
import { createPrintRoutes } from './print.routes';
import { createReportRoutes } from './report.routes';
import { createSampleRoutes } from './sample.routes';
import { createCustomerRoutes } from './customer.routes';
import { createWorkerRoutes } from './worker.routes';
import { buildServices } from '../../../modules/production';
import { requireRole } from '../middleware/auth';

export async function registerRoutes(app: Express): Promise<void> {
  const services = await buildServices();

  // 订单：管理员和跟单员可创建/编辑，所有人可查看
  app.use('/api/orders', createOrderRoutes(services.orderService));

  // 工序：师傅操作，所有人可查看
  app.use('/api/processes', createProcessRoutes(services.processService));

  // 材料：管理员+跟单员管理，所有人可查看
  app.use('/api/materials', createMaterialRoutes(services.materialService, services.inventoryRepo, services.materialRepo));

  // 追溯：所有人可查看
  app.use('/api/traces', createTraceRoutes(services.traceService));

  // 反馈：师傅可提交，管理员可处理
  app.use('/api/feedback', createFeedbackRoutes(services.traceEngine, services.processEngine));

  // 打印：所有人可用
  app.use('/api/print', createPrintRoutes(services.orderService, services.processService));

  // 报表：管理员+跟单员
  app.use('/api/reports', requireRole('admin', 'merchandiser'), createReportRoutes(services.orderService, services.inventoryRepo));

  // 样板：管理员+跟单员管理
  app.use('/api/samples', requireRole('admin', 'merchandiser'), createSampleRoutes());

  // 客户：管理员+跟单员管理
  app.use('/api/customers', requireRole('admin', 'merchandiser'), createCustomerRoutes());
  app.use('/api/workers', createWorkerRoutes(services.orderService, services.processService));
}

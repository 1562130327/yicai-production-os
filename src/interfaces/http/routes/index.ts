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
import { createWorkersAdminRoutes } from './workers-admin.routes';
import { createMachineRoutes } from './machine.routes';
import { createDashboardRoutes } from './dashboard.routes';
import { createUserRoutes } from './user.routes';
import { buildServices } from '../../../modules/production';
import { requireRole } from '../middleware/auth';

export async function registerRoutes(app: Express): Promise<void> {
  const services = await buildServices();

  app.use('/api/orders', createOrderRoutes(services.orderService));
  app.use('/api/processes', createProcessRoutes(services.processService));
  app.use('/api/materials', createMaterialRoutes(services.materialService, services.inventoryRepo, services.materialRepo));
  app.use('/api/traces', createTraceRoutes(services.traceService));
  app.use('/api/feedback', createFeedbackRoutes(services.traceEngine, services.processEngine));
  app.use('/api/print', createPrintRoutes(services.orderService, services.processService));
  app.use('/api/reports', requireRole('admin', 'merchandiser'), createReportRoutes(services.orderService, services.inventoryRepo));
  app.use('/api/samples', requireRole('admin', 'merchandiser'), createSampleRoutes());
  app.use('/api/customers', requireRole('admin', 'merchandiser'), createCustomerRoutes());
  app.use('/api/workers', createWorkerRoutes(services.orderService, services.processService));
  app.use('/api/workers-admin', createWorkersAdminRoutes(services.workerRepo));
  app.use('/api/machines', createMachineRoutes(services.machineRepo));
  app.use('/api/dashboard', requireRole('admin', 'merchandiser'), createDashboardRoutes(services));
  app.use('/api/users', requireRole('admin'), createUserRoutes());
}

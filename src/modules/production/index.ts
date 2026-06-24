// ============================================================
// 溢彩 Production OS — 生产模块（依赖组装）
// 不使用 DI 框架，手工组装依赖图
// ============================================================

import { getConnection } from '../../infrastructure/database/connection';
import { SqliteOrderRepository } from '../../infrastructure/database/repositories/order.repo';
import { SqliteProcessRepository } from '../../infrastructure/database/repositories/process.repo';
import { SqliteMaterialRepository } from '../../infrastructure/database/repositories/material.repo';
import { SqliteInventoryRepository } from '../../infrastructure/database/repositories/inventory.repo';
import { SqliteTaskRepository } from '../../infrastructure/database/repositories/task.repo';
import { SqliteTraceRepository } from '../../infrastructure/database/repositories/trace.repo';

// 引擎
import { ProcessEngine } from '../../engines/process-engine';
import { MaterialEngine } from '../../engines/material-engine';
import { ScheduleEngine } from '../../engines/schedule-engine';
import { TraceEngine } from '../../engines/trace-engine';

// 应用服务
import { OrderService } from '../../application/order';
import { ProcessService } from '../../application/process';
import { MaterialService } from '../../application/material';
import { ScheduleService } from '../../application/schedule';
import { TraceService } from '../../application/trace';

export interface Services {
  orderService: OrderService;
  processService: ProcessService;
  materialService: MaterialService;
  scheduleService: ScheduleService;
  traceService: TraceService;
  processEngine: ProcessEngine;
  traceEngine: TraceEngine;
  scheduleEngine: ScheduleEngine;
  inventoryRepo: any;
  materialRepo: any;
}

let cachedServices: Services | null = null;

export async function buildServices(): Promise<Services> {
  if (cachedServices) return cachedServices;

  const db = await getConnection();

  // --- 仓储 ---
  const orderRepo = new SqliteOrderRepository(db);
  const processRepo = new SqliteProcessRepository(db);
  const materialRepo = new SqliteMaterialRepository(db);
  const inventoryRepo = new SqliteInventoryRepository(db);
  const taskRepo = new SqliteTaskRepository(db);
  const traceRepo = new SqliteTraceRepository(db);

  // --- 引擎 ---
  const processEngine = new ProcessEngine(processRepo);
  const materialEngine = new MaterialEngine(materialRepo, inventoryRepo);
  const scheduleEngine = new ScheduleEngine(taskRepo, processRepo);
  const traceEngine = new TraceEngine(traceRepo);

  // --- 服务 ---
  const orderService = new OrderService(orderRepo, processEngine, materialEngine, traceEngine);
  const processService = new ProcessService(processRepo, processEngine, traceEngine, inventoryRepo, orderRepo);
  const materialService = new MaterialService(materialRepo, inventoryRepo, materialEngine);
  const scheduleService = new ScheduleService(taskRepo, scheduleEngine, traceEngine);
  const traceService = new TraceService(traceEngine);

  cachedServices = {
    orderService,
    processService,
    materialService,
    scheduleService,
    traceService,
    processEngine,
    traceEngine,
    scheduleEngine,
    inventoryRepo,
    materialRepo,
  };

  return cachedServices;
}

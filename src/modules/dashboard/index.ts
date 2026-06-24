// ============================================================
// 溢彩 Production OS — 车间看板模块
// 聚合全厂实时数据，供 Dashboard 展示
// ============================================================

import { Services } from '../production';

export interface DashboardData {
  activeOrders: number;
  scheduledOrders: number;
  queuedTasks: number;
  runningTasks: number;
  completedToday: number;
  materialAlerts: number;
  machineUtilization: { total: number; running: number; idle: number; maintenance: number };
  topPriorityOrders: Array<{ id: string; code: string; priority: string; status: string }>;
}

export async function getDashboardData(services: Services): Promise<DashboardData> {
  const orders = await services.orderService.getActiveOrders();
  const orderList = orders.isSuccess() ? orders.value : [];

  const queuedTasks = services.taskRepo ? await services.taskRepo.findQueued() : [];
  const runningTasks = services.taskRepo ? await services.taskRepo.findRunning() : [];

  // 今日完成数（简化：查 completed 状态的订单）
  const allOrders = orderList;
  const today = new Date().toISOString().split('T')[0];
  const completedToday = allOrders.filter(o => o.status === 'completed' && o.updatedAt.startsWith(today)).length;

  // 机器利用率
  const machines = await services.machineRepo.findAll();
  const machineUtilization = {
    total: machines.length,
    running: machines.filter((m: any) => m.status === 'running').length,
    idle: machines.filter((m: any) => m.status === 'idle').length,
    maintenance: machines.filter((m: any) => m.status === 'maintenance').length,
  };

  // 材料预警（库存低于10张的批次）
  const allInventory = await services.inventoryRepo.findAvailable('', 0);
  const materialAlerts = allInventory.filter((b: any) => b.remainingQty < 10).length;

  // 高优先级订单
  const topPriorityOrders = orderList
    .filter(o => ['deadline', 'urgent'].includes(o.priority))
    .slice(0, 5)
    .map(o => ({ id: o.id, code: o.code, priority: o.priority, status: o.status }));

  return {
    activeOrders: orderList.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length,
    scheduledOrders: orderList.filter(o => o.status === 'scheduled').length,
    queuedTasks: queuedTasks.length,
    runningTasks: runningTasks.length,
    completedToday,
    materialAlerts,
    machineUtilization,
    topPriorityOrders,
  };
}

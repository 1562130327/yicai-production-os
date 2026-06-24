// ============================================================
// 溢彩 Production OS — 车间看板模块（占位，Phase 6 实现）
// ============================================================

import { Services } from '../production';

export interface DashboardData {
  activeOrders: number;
  queuedTasks: number;
  runningTasks: number;
  materialAlerts: number;
  completedToday: number;
}

export async function getDashboardData(services: Services): Promise<DashboardData> {
  // TODO: Phase 6 实现完整看板数据聚合
  return {
    activeOrders: 0,
    queuedTasks: 0,
    runningTasks: 0,
    materialAlerts: 0,
    completedToday: 0,
  };
}

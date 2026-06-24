// ============================================================
// 溢彩 Production OS — 调度引擎内部类型
// ============================================================

/** 机器型号 */
export interface Machine {
  id: string;
  name: string;
  type: string;
  status: 'idle' | 'running' | 'maintenance';
  currentTaskId?: string;
}

/** 工人 */
export interface Worker {
  id: string;
  name: string;
  skills: string[];
  currentTaskId?: string;
}

/** 调度结果 */
export interface ScheduleResult {
  taskId: string;
  workerId: string;
  machineId: string;
  scheduledAt: string;
}

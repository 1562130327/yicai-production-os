// ============================================================
// 溢彩 Production OS — 生产任务领域实体
// 映射自：生产排单表 — 任务分配
// ============================================================

import { TaskStatus, ProcessType, Priority } from '../../shared/types';

/** 生产任务 */
export interface Task {
  readonly id: string;
  readonly orderId: string;         // 所属订单
  readonly processStepId: string;   // 对应工序步骤
  readonly processType: ProcessType;
  readonly assignedWorker?: string; // 分配的操作工
  readonly machineId?: string;      // 分配的机器
  readonly status: TaskStatus;
  readonly priority: Priority;      // 调度优先级
  readonly estimatedHours: number;  // 预估工时
  readonly actualHours?: number;    // 实际工时
  readonly quantity: number;        // 生产数量
  readonly completedQty?: number;   // 已完成数量
  readonly notes?: string;          // 备注
  readonly scheduledAt?: string;    // 计划开始时间
  readonly startedAt?: string;      // 实际开始时间
  readonly completedAt?: string;    // 完成时间
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** 创建任务输入 */
export interface CreateTaskInput {
  orderId: string;
  processStepId: string;
  processType: ProcessType;
  quantity: number;
  priority: Priority;
  estimatedHours: number;
}

/** 分配任务输入 */
export interface AssignTaskInput {
  worker: string;
  machineId: string;
  scheduledAt?: string;
}

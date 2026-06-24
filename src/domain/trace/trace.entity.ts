// ============================================================
// 溢彩 Production OS — 追溯领域实体
// 所有生产行为可追溯
// ============================================================

import { TraceEventType, ProcessType, ProcessStatus } from '../../shared/types';

/** 追溯事件 */
export interface TraceEvent {
  readonly id: string;
  readonly orderId: string;         // 关联订单
  readonly eventType: TraceEventType;
  readonly fromProcess?: string;    // 来源工序 stepId
  readonly toProcess?: string;      // 目标工序 stepId
  readonly processType?: ProcessType;
  readonly processStatus?: ProcessStatus;
  readonly taskId?: string;         // 关联任务
  readonly worker?: string;         // 操作人
  readonly machineId?: string;      // 机器
  readonly materialBatchId?: string; // 使用的材料批次
  readonly metadata: Record<string, unknown>; // 扩展数据
  readonly timestamp: string;
}

/** 生产追溯链 */
export interface TraceChain {
  readonly orderId: string;
  readonly events: TraceEvent[];
  readonly startTime: string;
  readonly endTime?: string;
  readonly totalSteps: number;
  readonly completedSteps: number;
}

/** 异常事件 */
export interface AnomalyEvent {
  readonly id: string;
  readonly orderId: string;
  readonly processStepId: string;
  readonly type: 'defect' | 'shortage' | 'machine_failure' | 'human_error';
  readonly description: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly detectedAt: string;
  readonly resolvedAt?: string;
  readonly resolution?: string;
  readonly triggerSupplement: boolean;  // 是否触发补产
}

/** 补产记录 */
export interface SupplementRecord {
  readonly id: string;
  readonly originalOrderId: string;  // 原订单
  readonly supplementId: string; // 补产订单
  readonly reason: string;
  readonly quantity: number;
  readonly createdAt: string;
}

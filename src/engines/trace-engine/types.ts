// ============================================================
// 溢彩 Production OS — 追溯引擎内部类型
// ============================================================

import { TraceEventType, ProcessType, ProcessStatus } from '../../shared/types';

/** 记录事件参数 */
export interface LogEventParams {
  orderId: string;
  eventType: TraceEventType;
  processType?: ProcessType;
  processStatus?: ProcessStatus;
  fromProcess?: string;
  toProcess?: string;
  taskId?: string;
  worker?: string;
  machineId?: string;
  materialBatchId?: string;
  metadata?: Record<string, unknown>;
}

/** 异常报告参数 */
export interface ReportAnomalyParams {
  orderId: string;
  processStepId: string;
  type: string;
  description: string;
  severity: string;
  triggerSupplement?: boolean;
}

/** 补产参数 */
export interface CreateSupplementParams {
  originalOrderId: string;
  reason: string;
  quantity: number;
}

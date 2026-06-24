// ============================================================
// 溢彩 Production OS — 追溯仓储接口
// ============================================================

import { TraceEvent, TraceChain, AnomalyEvent, SupplementRecord } from './trace.entity';

export interface TraceRepository {
  /** 记录事件 */
  logEvent(event: Omit<TraceEvent, 'id' | 'timestamp'>): Promise<TraceEvent>;

  /** 获取订单完整追溯链 */
  getChain(orderId: string): Promise<TraceChain>;

  /** 获取订单事件列表 */
  getEvents(orderId: string): Promise<TraceEvent[]>;

  /** 按工序追溯 */
  getEventsByProcess(processStepId: string): Promise<TraceEvent[]>;

  /** 按材料批次追溯 */
  getEventsByBatch(materialBatchId: string): Promise<TraceEvent[]>;

  /** 记录异常 */
  logAnomaly(anomaly: Omit<AnomalyEvent, 'id'>): Promise<AnomalyEvent>;

  /** 获取订单异常列表 */
  getAnomalies(orderId: string): Promise<AnomalyEvent[]>;

  /** 记录补产 */
  logSupplement(supplement: Omit<SupplementRecord, 'id' | 'createdAt'>): Promise<SupplementRecord>;

  /** 获取补产记录 */
  getSupplements(originalOrderId: string): Promise<SupplementRecord[]>;
}

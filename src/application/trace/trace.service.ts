// ============================================================
// 溢彩 Production OS — 追溯应用服务
// ============================================================

import { TraceEngine } from '../../engines/trace-engine';
import { TraceEvent, AnomalyEvent, SupplementRecord } from '../../domain/trace';
import { Result, success } from '../../shared/utils';
import { DomainError } from '../../shared/errors';

export class TraceService {
  constructor(private readonly traceEngine: TraceEngine) {}

  /** 获取订单完整追溯 */
  async getOrderTrace(orderId: string): Promise<Result<TraceEvent[], DomainError>> {
    return this.traceEngine.getOrderTrace(orderId);
  }

  /** 报告异常 */
  async reportAnomaly(params: {
    orderId: string;
    processStepId: string;
    type: AnomalyEvent['type'];
    description: string;
    severity: AnomalyEvent['severity'];
  }): Promise<Result<AnomalyEvent, DomainError>> {
    return this.traceEngine.reportAnomaly(params);
  }

  /** 创建补产 */
  async supplement(params: {
    originalOrderId: string;
    reason: string;
    quantity: number;
  }): Promise<Result<SupplementRecord, DomainError>> {
    return this.traceEngine.createSupplement(params);
  }

  /** 材料批次反查 */
  async traceByBatch(batchId: string): Promise<Result<TraceEvent[], DomainError>> {
    return this.traceEngine.traceByBatch(batchId);
  }
}

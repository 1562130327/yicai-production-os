// ============================================================
// 溢彩 Production OS — 追溯引擎
// 核心职责：生产路径记录、异常反推、补产机制
// ============================================================

import { v4 as uuid } from 'uuid';
import { TraceRepository, TraceEvent, AnomalyEvent, SupplementRecord } from '../../domain/trace';
import { TraceEventType, ProcessType, ProcessStatus } from '../../shared/types';
import { Result, success, failure } from '../../shared/utils';
import { DomainError } from '../../shared/errors';

export class TraceEngine {
  constructor(private readonly traceRepo: TraceRepository) {}

  /** 记录生产事件 */
  async logEvent(params: {
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
  }): Promise<TraceEvent> {
    const event = await this.traceRepo.logEvent({
      orderId: params.orderId,
      eventType: params.eventType,
      processType: params.processType,
      processStatus: params.processStatus,
      fromProcess: params.fromProcess,
      toProcess: params.toProcess,
      taskId: params.taskId,
      worker: params.worker,
      machineId: params.machineId,
      materialBatchId: params.materialBatchId,
      metadata: params.metadata ?? {},
    });

    return event;
  }

  /** 获取订单完整追溯链 */
  async getOrderTrace(orderId: string): Promise<Result<TraceEvent[], DomainError>> {
    const events = await this.traceRepo.getEvents(orderId);
    return success(events);
  }

  /** 记录异常事件 */
  async reportAnomaly(params: {
    orderId: string;
    processStepId: string;
    type: AnomalyEvent['type'];
    description: string;
    severity: AnomalyEvent['severity'];
    triggerSupplement?: boolean;
  }): Promise<Result<AnomalyEvent, DomainError>> {
    const anomaly = await this.traceRepo.logAnomaly({
      orderId: params.orderId,
      processStepId: params.processStepId,
      type: params.type,
      description: params.description,
      severity: params.severity,
      detectedAt: new Date().toISOString(),
      triggerSupplement: params.triggerSupplement ?? false,
    });

    return success(anomaly);
  }

  /** 反向追溯：根据材料批次找所有关联订单 */
  async traceByBatch(materialBatchId: string): Promise<Result<TraceEvent[], DomainError>> {
    const events = await this.traceRepo.getEventsByBatch(materialBatchId);
    return success(events);
  }

  /** 反向追溯：根据工序找事件 */
  async traceByProcess(processStepId: string): Promise<Result<TraceEvent[], DomainError>> {
    const events = await this.traceRepo.getEventsByProcess(processStepId);
    return success(events);
  }

  /** 创建补产订单 */
  async createSupplement(params: {
    originalOrderId: string;
    reason: string;
    quantity: number;
  }): Promise<Result<SupplementRecord, DomainError>> {
    const supplementId = `SUP-${params.originalOrderId}-${Date.now()}`;

    const record = await this.traceRepo.logSupplement({
      originalOrderId: params.originalOrderId,
      supplementId: supplementId,
      reason: params.reason,
      quantity: params.quantity,
    });

    // 同时记录补产事件
    await this.logEvent({
      orderId: params.originalOrderId,
      eventType: 'supplement_started',
      metadata: {
        supplementId,
        reason: params.reason,
        quantity: params.quantity,
      },
    });

    return success(record);
  }

  /** 异常根因分析（简单版） */
  async analyzeAnomalies(orderId: string): Promise<Result<string[], DomainError>> {
    const anomalies = await this.traceRepo.getAnomalies(orderId);
    const causes = anomalies.map(a =>
      `[${a.severity}] ${a.type}: ${a.description} (${a.detectedAt})`,
    );
    return success(causes);
  }
}

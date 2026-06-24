// ============================================================
// 溢彩 Production OS — 追溯仓储实现（SQLite）
// ============================================================

import { v4 as uuid } from 'uuid';
import { Database } from '../connection';
import { TraceRepository, TraceEvent, TraceChain, AnomalyEvent, SupplementRecord } from '../../../domain/trace';

export class SqliteTraceRepository implements TraceRepository {
  constructor(private readonly db: Database) {}

  async logEvent(event: Omit<TraceEvent, 'id' | 'timestamp'>): Promise<TraceEvent> {
    const trace: TraceEvent = {
      id: uuid(),
      ...event,
      timestamp: new Date().toISOString(),
    };

    this.db.prepare(`
      INSERT INTO trace_events (id, order_id, event_type, process_type, process_status,
        from_process, to_process, task_id, worker, machine_id, material_batch_id, metadata, timestamp)
      VALUES (@id, @orderId, @eventType, @processType, @processStatus,
        @fromProcess, @toProcess, @taskId, @worker, @machineId, @materialBatchId, @metadata, @timestamp)
    `).run({
      id: trace.id,
      orderId: trace.orderId,
      eventType: trace.eventType,
      processType: trace.processType ?? null,
      processStatus: trace.processStatus ?? null,
      fromProcess: trace.fromProcess ?? null,
      toProcess: trace.toProcess ?? null,
      taskId: trace.taskId ?? null,
      worker: trace.worker ?? null,
      machineId: trace.machineId ?? null,
      materialBatchId: trace.materialBatchId ?? null,
      metadata: JSON.stringify(trace.metadata),
      timestamp: trace.timestamp,
    });

    return trace;
  }

  async getEvents(orderId: string): Promise<TraceEvent[]> {
    const rows = this.db.prepare(
      'SELECT * FROM trace_events WHERE order_id = ? ORDER BY timestamp ASC'
    ).all(orderId) as any[];
    return rows.map(r => this.toEventEntity(r));
  }

  async getChain(orderId: string): Promise<TraceChain> {
    const events = await this.getEvents(orderId);
    return {
      orderId,
      events,
      startTime: events[0]?.timestamp ?? '',
      endTime: events[events.length - 1]?.timestamp,
      totalSteps: events.length,
      completedSteps: events.filter(e => e.eventType === 'process_completed').length,
    };
  }

  async getEventsByProcess(processStepId: string): Promise<TraceEvent[]> {
    const rows = this.db.prepare(
      'SELECT * FROM trace_events WHERE from_process = ? OR to_process = ? ORDER BY timestamp ASC'
    ).all(processStepId, processStepId) as any[];
    return rows.map(r => this.toEventEntity(r));
  }

  async getEventsByBatch(materialBatchId: string): Promise<TraceEvent[]> {
    const rows = this.db.prepare(
      'SELECT * FROM trace_events WHERE material_batch_id = ? ORDER BY timestamp ASC'
    ).all(materialBatchId) as any[];
    return rows.map(r => this.toEventEntity(r));
  }

  async logAnomaly(anomaly: Omit<AnomalyEvent, 'id'>): Promise<AnomalyEvent> {
    const record: AnomalyEvent = {
      id: uuid(),
      ...anomaly,
    };

    this.db.prepare(`
      INSERT INTO anomaly_events (id, order_id, process_step_id, type, description, severity,
        detected_at, resolved_at, resolution, trigger_supplement)
      VALUES (@id, @orderId, @processStepId, @type, @description, @severity,
        @detectedAt, @resolvedAt, @resolution, @triggerSupplement)
    `).run({
      id: record.id,
      orderId: record.orderId,
      processStepId: record.processStepId,
      type: record.type,
      description: record.description,
      severity: record.severity,
      detectedAt: record.detectedAt,
      resolvedAt: record.resolvedAt ?? null,
      resolution: record.resolution ?? null,
      triggerSupplement: record.triggerSupplement ? 1 : 0,
    });

    return record;
  }

  async getAnomalies(orderId: string): Promise<AnomalyEvent[]> {
    const rows = this.db.prepare(
      'SELECT * FROM anomaly_events WHERE order_id = ? ORDER BY detected_at DESC'
    ).all(orderId) as any[];
    return rows.map(r => ({
      id: r.id,
      orderId: r.order_id,
      processStepId: r.process_step_id,
      type: r.type,
      description: r.description,
      severity: r.severity,
      detectedAt: r.detected_at,
      resolvedAt: r.resolved_at ?? undefined,
      resolution: r.resolution ?? undefined,
      triggerSupplement: r.trigger_supplement === 1,
    }));
  }

  async logSupplement(supplement: Omit<SupplementRecord, 'id' | 'createdAt'>): Promise<SupplementRecord> {
    const record: SupplementRecord = {
      id: uuid(),
      ...supplement,
      createdAt: new Date().toISOString(),
    };

    this.db.prepare(`
      INSERT INTO supplement_records (id, original_order_id, supplement_id, reason, quantity, created_at)
      VALUES (@id, @originalOrderId, @supplementId, @reason, @quantity, @createdAt)
    `).run({
      id: record.id,
      originalOrderId: record.originalOrderId,
      supplementId: record.supplementId,
      reason: record.reason,
      quantity: record.quantity,
      createdAt: record.createdAt,
    });

    return record;
  }

  async getSupplements(originalOrderId: string): Promise<SupplementRecord[]> {
    const rows = this.db.prepare(
      'SELECT * FROM supplement_records WHERE original_order_id = ? ORDER BY created_at DESC'
    ).all(originalOrderId) as any[];
    return rows.map(r => ({
      id: r.id,
      originalOrderId: r.original_order_id,
      supplementId: r.supplement_id,
      reason: r.reason,
      quantity: r.quantity,
      createdAt: r.created_at,
    }));
  }

  private toEventEntity(r: any): TraceEvent {
    return {
      id: r.id,
      orderId: r.order_id,
      eventType: r.event_type,
      processType: r.process_type ?? undefined,
      processStatus: r.process_status ?? undefined,
      fromProcess: r.from_process ?? undefined,
      toProcess: r.to_process ?? undefined,
      taskId: r.task_id ?? undefined,
      worker: r.worker ?? undefined,
      machineId: r.machine_id ?? undefined,
      materialBatchId: r.material_batch_id ?? undefined,
      metadata: JSON.parse(r.metadata ?? '{}'),
      timestamp: r.timestamp,
    };
  }
}

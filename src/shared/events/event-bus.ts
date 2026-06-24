// ============================================================
// 溢彩 Production OS — 领域事件总线
// 最小 pub/sub，解耦引擎间通信
// ============================================================

import { TraceEventType, ProcessType, ProcessStatus } from '../types';

export interface DomainEvent {
  readonly type: TraceEventType;
  readonly orderId: string;
  readonly processType?: ProcessType;
  readonly processStatus?: ProcessStatus;
  readonly taskId?: string;
  readonly worker?: string;
  readonly machineId?: string;
  readonly materialBatchId?: string;
  readonly metadata?: Record<string, unknown>;
  readonly timestamp: string;
}

type EventHandler = (event: DomainEvent) => Promise<void> | void;

class EventBus {
  private handlers = new Map<string, EventHandler[]>();

  on(eventType: string, handler: EventHandler): void {
    const list = this.handlers.get(eventType) || [];
    list.push(handler);
    this.handlers.set(eventType, list);
  }

  async emit(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    for (const h of handlers) {
      try { await h(event); } catch (e) { console.error('[EventBus] handler error:', event.type, e); }
    }
  }
}

export const eventBus = new EventBus();

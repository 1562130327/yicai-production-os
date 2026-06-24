// ============================================================
// 溢彩 Production OS — 领域事件总线（强类型版）
// ============================================================

import { DomainEventUnion, DomainEventByType } from './event-types';

/** 兼容旧接口的通用事件 */
export interface DomainEvent {
  readonly type: string;
  readonly orderId: string;
  readonly processType?: string;
  readonly processStatus?: string;
  readonly taskId?: string;
  readonly worker?: string;
  readonly machineId?: string;
  readonly materialBatchId?: string;
  readonly metadata?: Record<string, unknown>;
  readonly timestamp: string;
}

type EventHandler<T = DomainEventUnion> = (event: T) => Promise<void> | void;

class TypedEventBus {
  private handlers = new Map<string, EventHandler[]>();

  /** 订阅指定类型的事件 */
  on<T extends DomainEventUnion['type']>(
    eventType: T,
    handler: (event: DomainEventByType<T>) => Promise<void> | void,
  ): void {
    const list = this.handlers.get(eventType) || [];
    list.push(handler as EventHandler);
    this.handlers.set(eventType, list);
  }

  /** 订阅所有事件（用于追溯等全局监听） */
  onAll(handler: (event: DomainEventUnion) => Promise<void> | void): void {
    const ALL_KEY = '*';
    const list = this.handlers.get(ALL_KEY) || [];
    list.push(handler as EventHandler);
    this.handlers.set(ALL_KEY, list);
  }

  /** 发布事件 */
  async emit<T extends DomainEventUnion>(event: T): Promise<void> {
    // 类型特定的处理器
    const specificHandlers = this.handlers.get(event.type) || [];
    for (const h of specificHandlers) {
      try { await h(event); } catch (e) { console.error('[EventBus] handler error:', event.type, e); }
    }
    // 通配符处理器
    const allHandlers = this.handlers.get('*') || [];
    for (const h of allHandlers) {
      try { await h(event); } catch (e) { console.error('[EventBus] onAll error:', event.type, e); }
    }
  }

  /** 兼容旧接口：接受松散的 DomainEvent 对象 */
  async emitLegacy(event: DomainEvent): Promise<void> {
    const specificHandlers = this.handlers.get(event.type) || [];
    for (const h of specificHandlers) {
      try { await h(event as any); } catch (e) { console.error('[EventBus] legacy handler error:', event.type, e); }
    }
    const allHandlers = this.handlers.get('*') || [];
    for (const h of allHandlers) {
      try { await h(event as any); } catch (e) { console.error('[EventBus] legacy onAll error:', event.type, e); }
    }
  }

  /** 移除所有处理器 */
  clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = new TypedEventBus();

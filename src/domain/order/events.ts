// ============================================================
// 溢彩 Production OS — 订单领域事件
// ============================================================

import { v4 as uuid } from 'uuid';
import { OrderStatus, Priority } from './types';

export class OrderCreatedEvent {
  readonly type = 'order_created' as const;
  readonly id: string;
  readonly timestamp: string;
  constructor(
    readonly orderId: string,
    readonly code: string,
    readonly productCode: string,
    readonly customerName: string,
    readonly priority: Priority,
  ) {
    this.id = uuid();
    this.timestamp = new Date().toISOString();
  }
}

export class OrderCompletedEvent {
  readonly type = 'order_completed' as const;
  readonly id: string;
  readonly timestamp: string;
  constructor(
    readonly orderId: string,
    readonly completedAt: string = new Date().toISOString(),
  ) {
    this.id = uuid();
    this.timestamp = new Date().toISOString();
  }
}

export class OrderStatusChangedEvent {
  readonly type = 'order_status_changed' as const;
  readonly id: string;
  readonly timestamp: string;
  constructor(
    readonly orderId: string,
    readonly fromStatus: OrderStatus,
    readonly toStatus: OrderStatus,
  ) {
    this.id = uuid();
    this.timestamp = new Date().toISOString();
  }
}

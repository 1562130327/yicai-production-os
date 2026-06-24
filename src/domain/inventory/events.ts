import { v4 as uuid } from 'uuid';

export class InventoryDeductedEvent {
  readonly type = 'inventory_deducted' as const;
  readonly id: string;
  readonly timestamp: string;
  constructor(
    readonly batchId: string,
    readonly quantity: number,
    readonly orderId: string,
    readonly reason: string,
  ) {
    this.id = uuid();
    this.timestamp = new Date().toISOString();
  }
}

export class InventoryInboundEvent {
  readonly type = 'inventory_inbound' as const;
  readonly id: string;
  readonly timestamp: string;
  constructor(
    readonly batchId: string,
    readonly quantity: number,
    readonly reason: string,
  ) {
    this.id = uuid();
    this.timestamp = new Date().toISOString();
  }
}

export class InventoryLowWarningEvent {
  readonly type = 'anomaly_detected' as const;
  readonly id: string;
  readonly timestamp: string;
  constructor(
    readonly orderId: string,
    readonly batchId: string,
    readonly remainingQty: number,
    readonly materialSpec: string,
  ) {
    this.id = uuid();
    this.timestamp = new Date().toISOString();
  }
}

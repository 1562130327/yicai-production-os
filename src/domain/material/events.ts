import { v4 as uuid } from 'uuid';

export class MaterialMatchedEvent {
  readonly type = 'material_matched' as const;
  readonly id: string;
  readonly timestamp: string;
  constructor(
    readonly orderId: string,
    readonly materialSpec: string,
    readonly requiredQty: number,
    readonly availableQty: number,
    readonly matchRate: number,
    readonly batches: string[],
  ) {
    this.id = uuid();
    this.timestamp = new Date().toISOString();
  }
}

export class MaterialReservedEvent {
  readonly type = 'material_reserved' as const;
  readonly id: string;
  readonly timestamp: string;
  constructor(
    readonly orderId: string,
    readonly batchIds: string[],
  ) {
    this.id = uuid();
    this.timestamp = new Date().toISOString();
  }
}

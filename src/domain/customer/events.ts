import { v4 as uuid } from 'uuid';

export class CustomerCreatedEvent {
  readonly type = 'customer_created' as const;
  readonly id: string;
  readonly timestamp: string;
  constructor(
    readonly customerId: string,
    readonly name: string,
    readonly level: string,
  ) {
    this.id = uuid();
    this.timestamp = new Date().toISOString();
  }
}

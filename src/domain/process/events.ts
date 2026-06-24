import { v4 as uuid } from 'uuid';
import { ProcessType, ProcessStatus } from './types';

export class ProcessStartedEvent {
  readonly type = 'process_started' as const;
  readonly id: string;
  readonly timestamp: string;
  constructor(
    readonly orderId: string,
    readonly processType: ProcessType,
    readonly stepId: string,
    readonly flowId: string,
  ) {
    this.id = uuid();
    this.timestamp = new Date().toISOString();
  }
}

export class ProcessCompletedEvent {
  readonly type = 'process_completed' as const;
  readonly id: string;
  readonly timestamp: string;
  constructor(
    readonly orderId: string,
    readonly processType: ProcessType,
    readonly stepId: string,
    readonly flowId: string,
  ) {
    this.id = uuid();
    this.timestamp = new Date().toISOString();
  }
}

export class ProcessFailedEvent {
  readonly type = 'process_failed' as const;
  readonly id: string;
  readonly timestamp: string;
  constructor(
    readonly orderId: string,
    readonly processType: ProcessType,
    readonly stepId: string,
    readonly reason: string,
  ) {
    this.id = uuid();
    this.timestamp = new Date().toISOString();
  }
}

export class ReworkTriggeredEvent {
  readonly type = 'rework_triggered' as const;
  readonly id: string;
  readonly timestamp: string;
  constructor(
    readonly orderId: string,
    readonly processType: ProcessType,
    readonly stepId: string,
    readonly flowId: string,
    readonly reason: string,
  ) {
    this.id = uuid();
    this.timestamp = new Date().toISOString();
  }
}

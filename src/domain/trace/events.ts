import { v4 as uuid } from 'uuid';
import { AnomalyType, AnomalySeverity } from './types';

export class AnomalyDetectedEvent {
  readonly type = 'anomaly_detected' as const;
  readonly id: string;
  readonly timestamp: string;
  constructor(
    readonly orderId: string,
    readonly processStepId: string,
    readonly anomalyType: AnomalyType,
    readonly description: string,
    readonly severity: AnomalySeverity,
  ) {
    this.id = uuid();
    this.timestamp = new Date().toISOString();
  }
}

export class SupplementStartedEvent {
  readonly type = 'supplement_started' as const;
  readonly id: string;
  readonly timestamp: string;
  constructor(
    readonly orderId: string,
    readonly supplementId: string,
    readonly reason: string,
    readonly quantity: number,
  ) {
    this.id = uuid();
    this.timestamp = new Date().toISOString();
  }
}

export class SupplementNeededEvent {
  readonly type = 'supplement_needed' as const;
  readonly id: string;
  readonly timestamp: string;
  constructor(
    readonly orderId: string,
    readonly processType: string,
    readonly fromStepId: string,
    readonly toStepId: string,
    readonly shortfall: number,
    readonly reason: string,
  ) {
    this.id = uuid();
    this.timestamp = new Date().toISOString();
  }
}

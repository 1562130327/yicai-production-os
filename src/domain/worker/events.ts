import { v4 as uuid } from 'uuid';

export class WorkerAssignedEvent {
  readonly type = 'worker_assigned' as const;
  readonly id: string;
  readonly timestamp: string;
  constructor(
    readonly workerName: string,
    readonly taskId: string,
    readonly machineId: string,
  ) {
    this.id = uuid();
    this.timestamp = new Date().toISOString();
  }
}

export class WorkerReleasedEvent {
  readonly type = 'worker_released' as const;
  readonly id: string;
  readonly timestamp: string;
  constructor(
    readonly workerName: string,
    readonly taskId: string,
  ) {
    this.id = uuid();
    this.timestamp = new Date().toISOString();
  }
}

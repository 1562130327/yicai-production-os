import { v4 as uuid } from 'uuid';

export class TaskAssignedEvent {
  readonly type = 'task_assigned' as const;
  readonly id: string;
  readonly timestamp: string;
  constructor(
    readonly taskId: string,
    readonly orderId: string,
    readonly worker: string,
    readonly machineId: string,
    readonly scheduledAt: string,
  ) {
    this.id = uuid();
    this.timestamp = new Date().toISOString();
  }
}

export class TaskCompletedEvent {
  readonly type = 'task_completed' as const;
  readonly id: string;
  readonly timestamp: string;
  constructor(
    readonly taskId: string,
    readonly orderId: string,
    readonly worker: string,
    readonly machineId: string,
    readonly completedQty: number,
  ) {
    this.id = uuid();
    this.timestamp = new Date().toISOString();
  }
}

export class TaskFailedEvent {
  readonly type = 'task_failed' as const;
  readonly id: string;
  readonly timestamp: string;
  constructor(
    readonly taskId: string,
    readonly orderId: string,
    readonly reason: string,
  ) {
    this.id = uuid();
    this.timestamp = new Date().toISOString();
  }
}

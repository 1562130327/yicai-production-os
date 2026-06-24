import { v4 as uuid } from 'uuid';
import { MachineStatus } from './types';

export class MachineStatusChangedEvent {
  readonly type = 'machine_status_changed' as const;
  readonly id: string;
  readonly timestamp: string;
  constructor(
    readonly machineId: string,
    readonly fromStatus: MachineStatus,
    readonly toStatus: MachineStatus,
    readonly taskId?: string,
  ) {
    this.id = uuid();
    this.timestamp = new Date().toISOString();
  }
}

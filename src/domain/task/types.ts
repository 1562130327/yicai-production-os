export type TaskStatus = 'queued' | 'assigned' | 'running' | 'completed' | 'failed';

export interface CreateTaskInput {
  orderId: string;
  processStepId: string;
  processType: string;
  quantity: number;
  priority: string;
  estimatedHours: number;
}

export interface AssignTaskInput {
  worker: string;
  machineId: string;
  scheduledAt?: string;
}

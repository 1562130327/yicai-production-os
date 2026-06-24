import { describe, it, expect } from 'vitest';
import { TaskDomainService } from './service';
import { Task } from './task.entity';

const service = new TaskDomainService();

const mockTask: Task = {
  id: 'T1', orderId: 'ORD-001', processStepId: 'STEP-001', processType: '横竖分切',
  assignedWorker: '郑思远', machineId: 'M1', status: 'running', priority: 'deadline',
  estimatedHours: 2, quantity: 500, completedQty: 300,
  createdAt: '2026-06-20', updatedAt: '2026-06-23',
};

describe('TaskDomainService', () => {
  it('canAssign should fail for non-queued task', () => {
    const result = service.canAssign(mockTask);
    expect(result.isFailure()).toBe(true);
  });

  it('canAssign should succeed for queued task', () => {
    const queued = { ...mockTask, status: 'queued' as const };
    const result = service.canAssign(queued);
    expect(result.isSuccess()).toBe(true);
  });

  it('canComplete should succeed for running task', () => {
    const result = service.canComplete(mockTask);
    expect(result.isSuccess()).toBe(true);
  });

  it('canComplete should fail for queued task', () => {
    const queued = { ...mockTask, status: 'queued' as const };
    const result = service.canComplete(queued);
    expect(result.isFailure()).toBe(true);
  });

  it('calculatePriorityScore should weight deadline highest', () => {
    const deadlineScore = service.calculatePriorityScore({ ...mockTask, priority: 'deadline' });
    const normalScore = service.calculatePriorityScore({ ...mockTask, priority: 'normal' });
    expect(deadlineScore).toBeGreaterThan(normalScore);
  });
});

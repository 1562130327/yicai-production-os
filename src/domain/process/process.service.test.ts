import { describe, it, expect } from 'vitest';
import { ProcessDomainService } from './service';
import { ProcessFlow, ProcessStep } from './process.entity';

const service = new ProcessDomainService();

const mockSteps: ProcessStep[] = [
  { id: 'S1', type: '横竖分切', name: '横竖分切', sequence: 1, status: 'done', completedQty: 100 },
  { id: 'S2', type: '破片', name: '破片', sequence: 2, status: 'waiting', completedQty: 0 },
  { id: 'S3', type: '直切', name: '直切', sequence: 3, status: 'waiting', completedQty: 0 },
];

const mockFlow: ProcessFlow = {
  id: 'FLOW-001',
  orderId: 'ORD-001',
  steps: mockSteps,
  edges: [
    { from: 'S1', to: 'S2' },
    { from: 'S2', to: 'S3' },
  ],
};

describe('ProcessDomainService', () => {
  it('canStart should return true when upstream done', () => {
    expect(service.canStart(mockFlow, 'S2')).toBe(true);
  });

  it('canStart should return false when upstream not done', () => {
    const flow = { ...mockFlow, steps: [{ ...mockSteps[0], status: 'running' as const }, mockSteps[1], mockSteps[2]] };
    expect(service.canStart(flow, 'S2')).toBe(false);
  });

  it('calculateProgress should compute correctly', () => {
    const progress = service.calculateProgress(mockFlow);
    expect(progress.total).toBe(3);
    expect(progress.completed).toBe(1);
    expect(progress.percentage).toBe(33);
  });

  it('validateFlow should fail for empty flow', () => {
    const emptyFlow = { ...mockFlow, steps: [] };
    const result = service.validateFlow(emptyFlow);
    expect(result.isFailure()).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { OrderDomainService } from './service';
import { Order } from './order.entity';

const service = new OrderDomainService();

const mockOrder: Order = {
  id: 'ORD-001', code: 'YC-001', productCode: 'EVA-301', customerName: '测试',
  category: '鞋材', processTemplate: '片材切片', priority: 'normal', status: 'in_progress',
  materialSpec: 'EVA白色', sheetSize: '1200x2400', sliceSize: '300x400', sliceQty: 100,
  sheetOpened: 5, sheetCut: 5, punched: 0, dimensions: [],
  createdAt: '2026-06-20', updatedAt: '2026-06-23',
};

describe('OrderDomainService', () => {
  it('canComplete should succeed when all steps done', () => {
    const result = service.canComplete(mockOrder, true);
    expect(result.isSuccess()).toBe(true);
  });

  it('canComplete should fail when steps not done', () => {
    const result = service.canComplete(mockOrder, false);
    expect(result.isFailure()).toBe(true);
  });

  it('canComplete should fail for completed order', () => {
    const completed = { ...mockOrder, status: 'completed' as const };
    const result = service.canComplete(completed, true);
    expect(result.isFailure()).toBe(true);
  });

  it('canTransition should allow valid transitions', () => {
    expect(service.canTransition('pending', 'scheduled')).toBe(true);
    expect(service.canTransition('in_progress', 'completed')).toBe(true);
  });

  it('canTransition should reject invalid transitions', () => {
    expect(service.canTransition('completed', 'in_progress')).toBe(false);
    expect(service.canTransition('cancelled', 'pending')).toBe(false);
  });

  it('validateCreateInput should pass with valid data', () => {
    const result = service.validateCreateInput({
      code: 'YC-001', productCode: 'EVA-301', customerName: '客户',
      materialSpec: 'EVA白色', sliceQty: 100,
    });
    expect(result.isSuccess()).toBe(true);
  });

  it('validateCreateInput should fail with empty code', () => {
    const result = service.validateCreateInput({
      code: '', productCode: 'EVA-301', customerName: '客户',
      materialSpec: 'EVA白色', sliceQty: 100,
    });
    expect(result.isFailure()).toBe(true);
  });

  it('getPriorityWeight should return correct weights', () => {
    expect(service.getPriorityWeight('deadline')).toBe(100);
    expect(service.getPriorityWeight('urgent')).toBe(70);
    expect(service.getPriorityWeight('normal')).toBe(40);
    expect(service.getPriorityWeight('unmentioned')).toBe(10);
  });
});

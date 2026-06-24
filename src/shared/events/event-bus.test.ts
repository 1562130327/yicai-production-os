import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventBus } from './event-bus';

describe('TypedEventBus', () => {
  beforeEach(() => {
    eventBus.clear();
  });

  it('should emit and receive typed events', async () => {
    const handler = vi.fn();
    eventBus.on('order_created', handler);

    const event = {
      type: 'order_created' as const,
      id: '1',
      orderId: 'ORD-001',
      code: 'YC-2026-001',
      productCode: 'EVA-301',
      customerName: '测试客户',
      priority: 'normal' as const,
      timestamp: new Date().toISOString(),
    };

    await eventBus.emit(event);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('should support onAll wildcard subscription', async () => {
    const handler = vi.fn();
    eventBus.onAll(handler);

    const event = {
      type: 'order_completed' as const,
      id: '2',
      orderId: 'ORD-001',
      completedAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };

    await eventBus.emit(event);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('should not call handler for different event type', async () => {
    const handler = vi.fn();
    eventBus.on('order_created', handler);

    const event = {
      type: 'order_completed' as const,
      id: '3',
      orderId: 'ORD-001',
      completedAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };

    await eventBus.emit(event);
    expect(handler).not.toHaveBeenCalled();
  });

  it('should clear all handlers', () => {
    eventBus.on('order_created', () => {});
    eventBus.onAll(() => {});
    eventBus.clear();
    // After clear, emitting should not throw
  });
});

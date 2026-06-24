import { describe, it, expect } from 'vitest';

// Event integrity check: verify all Domain behaviors have corresponding events
describe('Event Integrity', () => {
  it('all domain modules should export events', async () => {
    const domains = ['order', 'process', 'material', 'inventory', 'task', 'trace', 'machine', 'worker', 'customer'];
    for (const domain of domains) {
      const mod = await import(`../../domain/${domain}/events`);
      expect(mod).toBeDefined();
      const exports = Object.keys(mod);
      expect(exports.length).toBeGreaterThan(0);
    }
  });

  it('event-types.ts should load without errors', async () => {
    const mod = await import('./event-types');
    expect(mod).toBeDefined();
  });

  it('order domain should have OrderCreatedEvent', async () => {
    const { OrderCreatedEvent } = await import('../../domain/order/events');
    const event = new OrderCreatedEvent('ORD-001', 'YC-001', 'EVA-301', '客户', 'normal');
    expect(event.type).toBe('order_created');
    expect(event.orderId).toBe('ORD-001');
    expect(event.id).toBeDefined();
    expect(event.timestamp).toBeDefined();
  });

  it('process domain should have ProcessStartedEvent', async () => {
    const { ProcessStartedEvent } = await import('../../domain/process/events');
    const event = new ProcessStartedEvent('ORD-001', '横竖分切', 'STEP-001', 'FLOW-001');
    expect(event.type).toBe('process_started');
  });

  it('task domain should have TaskAssignedEvent', async () => {
    const { TaskAssignedEvent } = await import('../../domain/task/events');
    const event = new TaskAssignedEvent('T1', 'ORD-001', '郑思远', 'M1', new Date().toISOString());
    expect(event.type).toBe('task_assigned');
  });

  it('inventory domain should have InventoryDeductedEvent', async () => {
    const { InventoryDeductedEvent } = await import('../../domain/inventory/events');
    const event = new InventoryDeductedEvent('INV-001', 10, 'ORD-001', '生产消耗');
    expect(event.type).toBe('inventory_deducted');
  });
});

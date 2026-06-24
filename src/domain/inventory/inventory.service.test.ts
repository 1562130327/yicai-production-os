import { describe, it, expect } from 'vitest';
import { InventoryDomainService } from './service';
import { InventoryBatch } from './inventory.entity';

const service = new InventoryDomainService();

const mockBatch: InventoryBatch = {
  id: 'INV-001', batchNo: 'B001', materialSpec: 'EVA白色1.2m', info: '1.2m×2.4m×55mm',
  supplierName: '惠州EVA厂', supplierInfo: '', remainingQty: 50, unit: '床',
  color: '白色', batchWidth: 1.2, price: 85, inboundWeek: 50,
  lastInboundAt: '2026-06-01', createdAt: '2026-01-01', updatedAt: '2026-06-20',
};

describe('InventoryDomainService', () => {
  it('canDeduct should succeed when stock sufficient', () => {
    const result = service.canDeduct(mockBatch, 30);
    expect(result.isSuccess()).toBe(true);
  });

  it('canDeduct should fail when stock insufficient', () => {
    const result = service.canDeduct(mockBatch, 60);
    expect(result.isFailure()).toBe(true);
  });

  it('calculateAvailability should sum all batches', () => {
    const total = service.calculateAvailability([mockBatch, { ...mockBatch, id: 'INV-002', remainingQty: 30 }]);
    expect(total).toBe(80);
  });

  it('isLowStock should detect low stock', () => {
    expect(service.isLowStock(mockBatch)).toBe(false);
    expect(service.isLowStock({ ...mockBatch, remainingQty: 5 })).toBe(true);
  });
});

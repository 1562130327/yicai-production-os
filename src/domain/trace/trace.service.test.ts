import { describe, it, expect } from 'vitest';
import { TraceDomainService } from './service';

const service = new TraceDomainService();

describe('TraceDomainService', () => {
  it('validateSeverity should accept valid severities', () => {
    expect(service.validateSeverity('low').isSuccess()).toBe(true);
    expect(service.validateSeverity('medium').isSuccess()).toBe(true);
    expect(service.validateSeverity('high').isSuccess()).toBe(true);
    expect(service.validateSeverity('critical').isSuccess()).toBe(true);
  });

  it('validateSeverity should reject invalid severity', () => {
    expect(service.validateSeverity('invalid').isFailure()).toBe(true);
  });

  it('shouldTriggerSupplement should trigger for critical', () => {
    expect(service.shouldTriggerSupplement('critical', 0)).toBe(true);
  });

  it('shouldTriggerSupplement should trigger for high with high defect rate', () => {
    expect(service.shouldTriggerSupplement('high', 0.15)).toBe(true);
  });

  it('shouldTriggerSupplement should not trigger for low', () => {
    expect(service.shouldTriggerSupplement('low', 0)).toBe(false);
  });
});

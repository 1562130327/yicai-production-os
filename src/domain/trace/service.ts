import { AnomalySeverity } from './types';
import { Result, success, failure } from '../../shared/utils';
import { DomainError } from '../../shared/errors';

export class TraceDomainService {
  /** 验证异常严重程度 */
  validateSeverity(severity: string): Result<AnomalySeverity, DomainError> {
    const valid: AnomalySeverity[] = ['low', 'medium', 'high', 'critical'];
    if (!valid.includes(severity as AnomalySeverity)) {
      return failure(new DomainError(`无效的严重程度: ${severity}`, 'INVALID_SEVERITY'));
    }
    return success(severity as AnomalySeverity);
  }

  /** 判断是否应触发补产 */
  shouldTriggerSupplement(severity: AnomalySeverity, defectRate: number): boolean {
    if (severity === 'critical') return true;
    if (severity === 'high' && defectRate > 0.1) return true;
    return false;
  }
}

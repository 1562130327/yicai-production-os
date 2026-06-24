import { MaterialMatch } from './types';
import { Result, success, failure } from '../../shared/utils';
import { DomainError } from '../../shared/errors';

export class MaterialDomainService {
  /** 计算材料需求 */
  calculateRequirement(sliceQty: number, slicesPerSheet: number, lossRate: number): number {
    if (slicesPerSheet <= 0) return 0;
    const safeRate = lossRate >= 1 ? 0.99 : lossRate;
    return Math.ceil(sliceQty / (slicesPerSheet * (1 - safeRate)));
  }

  /** 验证材料规格 */
  validateSpec(materialSpec: string, sheetSize: string, sliceSize: string): Result<void, DomainError> {
    if (!materialSpec?.trim()) return failure(new DomainError('材料规格不能为空', 'INVALID_SPEC'));
    if (!sheetSize?.trim()) return failure(new DomainError('片材尺寸不能为空', 'INVALID_SHEET_SIZE'));
    if (!sliceSize?.trim()) return failure(new DomainError('切片尺寸不能为空', 'INVALID_SLICE_SIZE'));
    return success(undefined);
  }

  /** 判断匹配是否足够 */
  isMatchSufficient(match: MaterialMatch): boolean {
    return match.shortage <= 0;
  }
}

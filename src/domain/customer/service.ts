import { Customer } from './customer.entity';
import { CustomerLevel } from './types';

export class CustomerDomainService {
  /** 获取客户等级权重 */
  getLevelWeight(level: CustomerLevel): number {
    const weights: Record<CustomerLevel, number> = { vip: 100, normal: 50, new: 30 };
    return weights[level] ?? 50;
  }

  /** 验证客户信息 */
  validate(customer: { name: string; contact: string; phone: string }): boolean {
    return !!(customer.name?.trim() && customer.contact?.trim() && customer.phone?.trim());
  }
}

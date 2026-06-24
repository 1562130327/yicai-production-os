// ============================================================
// 溢彩 Production OS — 订单领域服务
// 纯业务规则，不依赖 Repository 或 Engine
// ============================================================

import { Order } from './order.entity';
import { OrderStatus, Priority } from './types';
import { Result, success, failure } from '../../shared/utils';
import { DomainError } from '../../shared/errors';

/** 合法状态转换表 */
const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['material_matching', 'scheduled', 'cancelled'],
  material_matching: ['scheduled', 'cancelled'],
  scheduled: ['in_progress', 'cancelled'],
  in_progress: ['partial_done', 'completed', 'cancelled'],
  partial_done: ['in_progress', 'completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export class OrderDomainService {
  /** 判断订单是否可以完单 */
  canComplete(order: Order, allStepsDone: boolean): Result<void, DomainError> {
    if (order.status === 'completed') {
      return failure(new DomainError('订单已完成', 'ALREADY_COMPLETED'));
    }
    if (order.status === 'cancelled') {
      return failure(new DomainError('订单已取消', 'ORDER_CANCELLED'));
    }
    if (!allStepsDone) {
      return failure(new DomainError('工序未全部完成，无法完单', 'PROCESS_NOT_COMPLETE'));
    }
    return success(undefined);
  }

  /** 判断状态流转是否合法 */
  canTransition(from: OrderStatus, to: OrderStatus): boolean {
    return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
  }

  /** 验证创建订单输入 */
  validateCreateInput(input: { code: string; productCode: string; customerName: string; materialSpec: string; sliceQty: number }): Result<void, DomainError> {
    if (!input.code?.trim()) return failure(new DomainError('订单编号不能为空', 'INVALID_CODE'));
    if (!input.productCode?.trim()) return failure(new DomainError('款号不能为空', 'INVALID_PRODUCT_CODE'));
    if (!input.customerName?.trim()) return failure(new DomainError('客户名称不能为空', 'INVALID_CUSTOMER'));
    if (!input.materialSpec?.trim()) return failure(new DomainError('材料规格不能为空', 'INVALID_MATERIAL'));
    if (input.sliceQty <= 0) return failure(new DomainError('切片总数必须大于0', 'INVALID_QTY'));
    return success(undefined);
  }

  /** 获取优先级权重（用于排序） */
  getPriorityWeight(priority: Priority): number {
    const weights: Record<Priority, number> = {
      deadline: 100, urgent: 70, normal: 40, attention: 20, unmentioned: 10,
    };
    return weights[priority] ?? 40;
  }
}

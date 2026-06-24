// ============================================================
// 溢彩 Production OS — 订单应用服务
// 编排领域引擎完成订单全生命周期操作
// ============================================================

import { OrderRepository, CreateOrderInput, Order } from '../../domain/order';
import { ProcessEngine } from '../../engines/process-engine';
import { MaterialEngine } from '../../engines/material-engine';
import { TraceEngine } from '../../engines/trace-engine';
import { Result, success, failure } from '../../shared/utils';
import { DomainError } from '../../shared/errors';

export class OrderService {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly processEngine: ProcessEngine,
    private readonly materialEngine: MaterialEngine,
    private readonly traceEngine: TraceEngine,
  ) {}

  /** 创建订单 → 材料匹配 → 工序生成 → 追溯记录 */
  async createOrder(input: CreateOrderInput): Promise<Result<Order, DomainError>> {
    // 1. 材料匹配
    const matchResult = await this.materialEngine.matchMaterial(
      input.materialSpec,
      input.sheetSize,
      input.sliceSize,
      input.sliceQty,
    );
    if (matchResult.isFailure()) return failure(matchResult.error);

    const match = matchResult.value;
    if (match.shortage > 0) {
      return failure(
        new DomainError(
          `材料不足：${input.materialSpec} 缺 ${match.shortage}`,
          'MATERIAL_SHORTAGE',
          { match },
        ),
      );
    }

    // 2. 创建订单
    const order = await this.orderRepo.create(input);

    // 3. 生成工序流（从工艺模板展开）
    const flowResult = await this.processEngine.generateFlow({
      orderId: order.id,
      template: input.processTemplate,
      materialSpec: input.materialSpec,
      sheetSize: input.sheetSize,
      sliceSize: input.sliceSize,
      sliceQty: input.sliceQty,
      punchType: input.punchType,
      punchQty: input.punchQty,
    });
    if (flowResult.isFailure()) {
      // 工序流生成失败，回滚已创建的订单
      await this.orderRepo.updateStatus(order.id, 'cancelled');
      return failure(flowResult.error);
    }

    // 4. 记录追溯事件
    await this.traceEngine.logEvent({
      orderId: order.id,
      eventType: 'order_created',
      metadata: { code: input.code, productCode: input.productCode },
    });

    await this.traceEngine.logEvent({
      orderId: order.id,
      eventType: 'material_matched',
      metadata: {
        materialSpec: match.materialSpec,
        requiredQty: match.requiredQty,
        availableQty: match.availableQty,
        matchRate: match.matchRate,
        batches: match.suggestedBatches,
      },
    });

    // 5. 保持待排产状态（等待管理员分配）
    const updated = await this.orderRepo.updateStatus(order.id, 'pending');

    return success(updated);
  }

  /** 查询订单 */
  async getOrder(id: string): Promise<Result<Order, DomainError>> {
    const order = await this.orderRepo.findById(id);
    if (!order) {
      return failure(new DomainError(`订单 ${id} 不存在`, 'ORDER_NOT_FOUND'));
    }
    return success(order);
  }

  /** 获取活跃订单列表 */
  async getActiveOrders(): Promise<Result<Order[], DomainError>> {
    const orders = await this.orderRepo.findActive();
    return success(orders);
  }

  /** 更新订单状态 */
  async updateStatus(id: string, status: string): Promise<Order> {
    return this.orderRepo.updateStatus(id, status as any);
  }

  /** 完单 */
  async completeOrder(id: string): Promise<Result<Order, DomainError>> {
    const order = await this.orderRepo.findById(id);
    if (!order) {
      return failure(new DomainError(`订单 ${id} 不存在`, 'ORDER_NOT_FOUND'));
    }

    // 检查工序是否全部完成
    const flowComplete = await this.processEngine.isFlowComplete(id);
    if (!flowComplete) {
      return failure(
        new DomainError('工序未全部完成，无法完单', 'PROCESS_NOT_COMPLETE'),
      );
    }

    const updated = await this.orderRepo.updateStatus(id, 'completed');

    await this.traceEngine.logEvent({
      orderId: id,
      eventType: 'order_completed',
      metadata: { completedAt: new Date().toISOString() },
    });

    return success(updated);
  }
}

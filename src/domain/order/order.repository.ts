// ============================================================
// 溢彩 Production OS — 订单仓储接口
// ============================================================

import { Order, CreateOrderInput, UpdateOrderProgress } from './order.entity';
import { OrderStatus, PaginatedResult, Pagination } from '../../shared/types';

export interface OrderRepository {
  /** 创建订单 */
  create(input: CreateOrderInput): Promise<Order>;

  /** 按ID查找 */
  findById(id: string): Promise<Order | null>;

  /** 按编号查找 */
  findByCode(code: string): Promise<Order | null>;

  /** 按状态过滤 */
  findByStatus(status: OrderStatus, pagination?: Pagination): Promise<PaginatedResult<Order>>;

  /** 按客户过滤 */
  findByCustomer(customerName: string, pagination?: Pagination): Promise<PaginatedResult<Order>>;

  /** 搜索（按款号/编号/客户模糊匹配） */
  search(keyword: string, pagination?: Pagination): Promise<PaginatedResult<Order>>;

  /** 更新进度 */
  updateProgress(id: string, progress: UpdateOrderProgress): Promise<Order>;

  /** 更新状态 */
  updateStatus(id: string, status: OrderStatus): Promise<Order>;

  /** 获取活跃订单（未完成的） */
  findActive(): Promise<Order[]>;

  /** 统计 */
  countByStatus(status: OrderStatus): Promise<number>;

  /** 保存（通用） */
  save(order: Order): Promise<Order>;
}

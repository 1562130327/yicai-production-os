// ============================================================
// 溢彩 Production OS — 任务仓储接口
// ============================================================

import { Task, CreateTaskInput, AssignTaskInput } from './task.entity';
import { TaskStatus, PaginatedResult, Pagination } from '../../shared/types';

export interface TaskRepository {
  /** 创建任务 */
  create(input: CreateTaskInput): Promise<Task>;

  /** 按ID查找 */
  findById(id: string): Promise<Task | null>;

  /** 按订单查找所有任务 */
  findByOrder(orderId: string): Promise<Task[]>;

  /** 按工人查找任务 */
  findByWorker(worker: string, status?: TaskStatus): Promise<Task[]>;

  /** 按机器查找任务 */
  findByMachine(machineId: string, status?: TaskStatus): Promise<Task[]>;

  /** 分配任务 */
  assign(id: string, input: AssignTaskInput): Promise<Task>;

  /** 开始执行 */
  start(id: string): Promise<Task>;

  /** 完成 */
  complete(id: string, completedQty: number): Promise<Task>;

  /** 标记失败 */
  fail(id: string, reason: string): Promise<Task>;

  /** 获取待分配任务 */
  findQueued(): Promise<Task[]>;

  /** 获取进行中任务 */
  findRunning(): Promise<Task[]>;

  /** 保存 */
  save(task: Task): Promise<Task>;
}

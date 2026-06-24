// ============================================================
// 溢彩 Production OS — 工序仓储接口
// ============================================================

import { ProcessFlow, ProcessStep, ProcessStatus } from './process.entity';

export interface ProcessRepository {
  /** 创建工序流 */
  createFlow(flow: ProcessFlow): Promise<ProcessFlow>;

  /** 按订单ID查找工序流 */
  findByOrderId(orderId: string): Promise<ProcessFlow | null>;

  /** 按ID查找工序流 */
  findById(id: string): Promise<ProcessFlow | null>;

  /** 更新工序步骤状态 */
  updateStepStatus(flowId: string, stepId: string, status: ProcessStatus): Promise<ProcessStep>;

  /** 追加工序步骤（返工/补产） */
  appendStep(flowId: string, step: ProcessStep): Promise<ProcessFlow>;

  /** 新增依赖边 */
  addEdge(flowId: string, edge: { from: string; to: string; condition?: string }): Promise<ProcessFlow>;

  /** 更新分次完成数量 */
  updateCompletedQty(stepId: string, completedQty: number, outputQty?: number, defectQty?: number): Promise<ProcessStep>;

  /** 保存完整工序流 */
  save(flow: ProcessFlow): Promise<ProcessFlow>;
}

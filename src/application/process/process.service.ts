import { ProcessRepository, ProcessFlow } from '../../domain/process';
import { ProcessEngine } from '../../engines/process-engine';
import { TraceEngine } from '../../engines/trace-engine';
import { InventoryRepository } from '../../domain/inventory';
import { OrderRepository } from '../../domain/order';
import { ProcessStatus } from '../../shared/types';
import { Result, success, failure } from '../../shared/utils';
import { DomainError } from '../../shared/errors';

export class ProcessService {
  constructor(
    private readonly processRepo: ProcessRepository,
    private readonly processEngine: ProcessEngine,
    private readonly traceEngine: TraceEngine,
    private readonly inventoryRepo: InventoryRepository,
    private readonly orderRepo: OrderRepository,
  ) {}

  async advanceStep(flowId: string, stepId: string, toStatus: string): Promise<Result<void, DomainError>> {
    const result = await this.processEngine.advanceStep(flowId, stepId, toStatus as any);
    if (result.isFailure()) return failure(result.error);
    return success(undefined);
  }

  async getFlow(orderId: string): Promise<Result<ProcessFlow, DomainError>> {
    const flow = await this.processRepo.findByOrderId(orderId);
    if (!flow) return failure(new DomainError('工序流不存在', 'FLOW_NOT_FOUND'));
    return success(flow);
  }

  async startStep(flowId: string, stepId: string): Promise<Result<void, DomainError>> {
    const flow = await this.processRepo.findById(flowId);
    const result = await this.processEngine.advanceStep(flowId, stepId, 'running');
    if (result.isFailure()) return failure(result.error);
    const step = result.value;
    await this.traceEngine.logEvent({
      orderId: flow?.orderId ?? stepId, eventType: 'process_started',
      processType: step.type, processStatus: 'running', metadata: { flowId, stepId },
    });
    return success(undefined);
  }

  async completeStep(flowId: string, stepId: string): Promise<Result<void, DomainError>> {
    const flow = await this.processRepo.findById(flowId);
    const result = await this.processEngine.advanceStep(flowId, stepId, 'done');
    if (result.isFailure()) return failure(result.error);
    const step = result.value;
    await this.traceEngine.logEvent({
      orderId: flow?.orderId ?? stepId, eventType: 'process_completed',
      processType: step.type, processStatus: 'done', metadata: { flowId, stepId },
    });
    await this.processEngine.onStepCompleted(flowId, stepId);
    return success(undefined);
  }

  async reworkStep(flowId: string, stepId: string, reason: string): Promise<Result<void, DomainError>> {
    const flow = await this.processRepo.findById(flowId);
    const result = await this.processEngine.triggerRework(flowId, stepId);
    if (result.isFailure()) return failure(result.error);
    await this.traceEngine.logEvent({
      orderId: flow?.orderId ?? stepId, eventType: 'rework_triggered',
      metadata: { flowId, stepId, reason },
    });
    return success(undefined);
  }

  async recordCompletion(
    flowId: string, stepId: string,
    params: { quantity: number; worker: string; defectQty?: number; notes?: string },
  ): Promise<Result<{ step: any; isComplete: boolean; shortfall: number; supplementChain: any[] }, DomainError>> {
    const flow = await this.processRepo.findById(flowId);
    if (!flow) return failure(new DomainError('工序流不存在', 'FLOW_NOT_FOUND'));

    const result = await this.processEngine.recordCompletion(flowId, stepId, params);
    if (result.isFailure()) return result;

    const { step, isComplete, shortfall, supplementChain } = result.value;

    // 第一步 横竖分切 → 自动扣库存（调用原材料）
    if (step.type === '横竖分切' && step.sequence === 1 && params.quantity > 0) {
      try {
        const order = await this.orderRepo.findById(flow.orderId);
        if (order) {
          const batches = await this.inventoryRepo.findByMaterialSpec(order.materialSpec);
          const orderWidth = (order.sheetSize.match(/([\d.]+)m/) || [])[1];
          const matchingBatch = batches.find(b => {
            const batchWidth = (b.info.match(/([\d.]+)m/) || [])[1];
            return orderWidth && batchWidth && Math.abs(parseFloat(orderWidth) - parseFloat(batchWidth)) < 0.1;
          }) || batches[0];

          if (matchingBatch) {
            if (matchingBatch.remainingQty >= params.quantity) {
              await this.inventoryRepo.deduct({
                batchId: matchingBatch.id, quantity: params.quantity,
                orderId: flow.orderId, reason: `订单${order.code} 郑思远调用原材料`,
              });
              // 扣减后检查是否低于预警线
              const updated = await this.inventoryRepo.findById(matchingBatch.id);
              if (updated && updated.remainingQty < 10) {
                await this.traceEngine.logEvent({
                  orderId: flow.orderId, eventType: 'anomaly_detected',
                  metadata: { warning: '库存低于10张', spec: updated.materialSpec, batch: updated.batchNo, remaining: updated.remainingQty },
                });
              }
            } else {
              // 库存不足，记录预警
              await this.traceEngine.logEvent({
                orderId: flow.orderId, eventType: 'anomaly_detected',
                metadata: { warning: '库存不足', spec: matchingBatch.materialSpec, need: params.quantity, have: matchingBatch.remainingQty, advice: '请联系管理员采购入库' },
              });
            }
          }
        }
      } catch (e) {
        await this.traceEngine.logEvent({
          orderId: flow.orderId, eventType: 'anomaly_detected',
          metadata: { error: '库存扣减异常', detail: (e as Error).message },
        });
      }
    }

    // 记录追溯
    await this.traceEngine.logEvent({
      orderId: flow.orderId, eventType: 'task_completed',
      processType: step.type, taskId: stepId, worker: params.worker,
      metadata: { quantity: params.quantity, defectQty: params.defectQty ?? 0,
        completedQty: step.completedQty, requiredQty: step.requiredQty, isComplete, shortfall },
    });

    if (supplementChain.length > 0) {
      for (const s of supplementChain) {
        await this.traceEngine.logEvent({
          orderId: flow.orderId, eventType: 'supplement_needed',
          processType: s.type, fromProcess: s.id, toProcess: stepId,
          metadata: { shortfall, reason: `${step.type}数量不够${shortfall}，请${s.type}补产` },
        });
      }
    }

    return success({ step, isComplete, shortfall, supplementChain });
  }
}

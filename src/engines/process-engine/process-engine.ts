// ============================================================
// 溢彩 Production OS — 工序引擎
// 核心职责：工艺模板展开、工序流转控制、DAG构建、状态转换、返工路径
// ============================================================

import { v4 as uuid } from 'uuid';
import {
  ProcessFlow,
  ProcessStep,
  ProcessEdge,
  CreateProcessInput,
  ProcessRepository,
} from '../../domain/process';
import { ProcessType, ProcessStatus, PROCESS_TEMPLATE_MAP } from '../../shared/types';
import { canTransition, isTerminal } from './state-machine';
import { Result, success, failure } from '../../shared/utils';
import { DomainError } from '../../shared/errors';

/** 工序类型默认执行顺序（位置=执行序号） */
export const PROCESS_ORDER: Record<ProcessType, number> = {
  '横竖分切': 1, '破片': 2, '直切': 3, '冲型': 4,
  '背胶': 5, '贴布': 6, '点胶': 7, '粘胶': 8,
  '改回填': 9, '打包': 10,
};

export class ProcessEngine {
  constructor(private readonly processRepo: ProcessRepository) {}

  /** 从工艺模板生成工序流 DAG */
  async generateFlow(input: CreateProcessInput): Promise<Result<ProcessFlow, DomainError>> {
    // 1. 从模板展开原子工序（优先数据库，常量后备）
    let types: ProcessType[] = [];
    try {
      const row = (this.processRepo as any).db?.prepare?.('SELECT steps FROM process_templates WHERE name = ?')?.get(input.template) as any;
      if (row) types = JSON.parse(row.steps);
    } catch {}
    if (!types.length) types = [...(PROCESS_TEMPLATE_MAP[input.template] ?? [])];

    // 2. 处理增删
    if (input.removeSteps) {
      types = types.filter(t => !input.removeSteps!.includes(t));
    }
    if (input.extraSteps) {
      types.push(...input.extraSteps);
    }

    // 3. 按执行顺序排序
    const sortedTypes = types.sort(
      (a, b) => (PROCESS_ORDER[a] ?? 99) - (PROCESS_ORDER[b] ?? 99),
    );

    if (sortedTypes.length === 0) {
      return failure(new DomainError('工艺模板展开后无工序', 'EMPTY_TEMPLATE', { template: input.template }));
    }

    // 4. 确定各工序的需求数量
    const stepRequiredQty = (type: ProcessType): number | undefined => {
      switch (type) {
        case '横竖分切': case '破片': return undefined; // 片材数由师傅判断
        case '直切': return input.sliceQty > 0 ? input.sliceQty : undefined;
        case '冲型': return (input.punchQty ?? 0) > 0 ? input.punchQty : undefined;
        default: return (input.punchQty ?? input.sliceQty ?? 0) > 0 ? (input.punchQty ?? input.sliceQty) : undefined;
      }
    };

    // 5. 生成工序步骤
    const steps: ProcessStep[] = sortedTypes.map((type, idx) => ({
      id: uuid(),
      type,
      name: `${type}`,
      sequence: idx + 1,
      status: 'waiting' as ProcessStatus,
      completedQty: 0,
      requiredQty: stepRequiredQty(type),
      // 材料约束只给第一步
      requiredMaterialSpec: idx === 0 ? input.materialSpec : undefined,
      requiredSheetSize: idx === 0 ? input.sheetSize : undefined,
      // 切割参数
      sliceSize: ['横竖分切', '破片', '直切'].includes(type) ? input.sliceSize : undefined,
      sliceQty: ['横竖分切', '破片', '直切'].includes(type) ? input.sliceQty : undefined,
      // 冲型参数
      punchType: type === '冲型' ? input.punchType : undefined,
      punchQty: type === '冲型' ? input.punchQty : undefined,
      // 冲型步骤需要的其他参数（punchSize 通过 step 级别的 metadata 或者字段传递，暂用 punchQty 和 sliceSize 区分直切和冲型）
    }));

    // 5. 构建边（线性依赖链）
    const edges: ProcessEdge[] = [];
    for (let i = 1; i < steps.length; i++) {
      edges.push({
        from: steps[i - 1].id,
        to: steps[i].id,
        condition: `${steps[i - 1].type} → ${steps[i].type}`,
      });
    }

    const flow: ProcessFlow = {
      id: uuid(),
      orderId: input.orderId,
      steps,
      edges,
    };

    const saved = await this.processRepo.createFlow(flow);
    return success(saved);
  }

  /** 推进工序到下一状态 */
  async advanceStep(
    flowId: string,
    stepId: string,
    toStatus: ProcessStatus,
  ): Promise<Result<ProcessStep, DomainError>> {
    const flow = await this.processRepo.findById(flowId);
    if (!flow) {
      return failure(new DomainError(`工序流 ${flowId} 不存在`, 'PROCESS_FLOW_NOT_FOUND'));
    }

    const step = flow.steps.find(s => s.id === stepId);
    if (!step) {
      return failure(new DomainError(`工序步骤 ${stepId} 不存在`, 'PROCESS_STEP_NOT_FOUND'));
    }

    if (!canTransition(step.status, toStatus)) {
      return failure(
        new DomainError(
          `非法流转: ${step.type} 从 ${step.status} → ${toStatus}`,
          'INVALID_TRANSITION',
          { stepId, from: step.status, to: toStatus },
        ),
      );
    }

    if (toStatus === 'ready') {
      const deps = this.getUpstreamSteps(flow, stepId);
      const allDone = deps.every(s => isTerminal(s.status));
      if (!allDone) {
        return failure(
          new DomainError('上游工序未完成，无法就绪', 'UPSTREAM_NOT_DONE', { stepId }),
        );
      }
    }

    const updated = await this.processRepo.updateStepStatus(flowId, stepId, toStatus);
    return success(updated);
  }

  /** 触发返工 */
  async triggerRework(flowId: string, stepId: string): Promise<Result<ProcessStep, DomainError>> {
    return this.advanceStep(flowId, stepId, 'rework');
  }

  /** 获取上游工序 */
  getUpstreamSteps(flow: ProcessFlow, stepId: string): ProcessStep[] {
    const incomingEdges = flow.edges.filter(e => e.to === stepId);
    return flow.steps.filter(s => incomingEdges.some(e => e.from === s.id));
  }

  /** 获取下游工序 */
  getDownstreamSteps(flow: ProcessFlow, stepId: string): ProcessStep[] {
    const outgoingEdges = flow.edges.filter(e => e.from === stepId);
    return flow.steps.filter(s => outgoingEdges.some(e => e.to === s.id));
  }

  /** 当某步骤完成时，自动触发下游步骤就绪 */
  async onStepCompleted(flowId: string, completedStepId: string): Promise<Result<ProcessStep[], DomainError>> {
    const flow = await this.processRepo.findById(flowId);
    if (!flow) {
      return failure(new DomainError(`工序流 ${flowId} 不存在`, 'PROCESS_FLOW_NOT_FOUND'));
    }

    const downstream = this.getDownstreamSteps(flow, completedStepId);
    const results: ProcessStep[] = [];

    for (const ds of downstream) {
      if (ds.status === 'waiting') {
        const result = await this.advanceStep(flowId, ds.id, 'ready');
        if (result.isSuccess()) results.push(result.value);
      }
    }

    return success(results);
  }

  /** 分次完成——记录完成数量，累计达标自动流转；不够则触发补产 */
  async recordCompletion(
    flowId: string,
    stepId: string,
    params: { quantity: number; worker: string; defectQty?: number; notes?: string },
  ): Promise<Result<{
    step: ProcessStep;
    isComplete: boolean;
    shortfall: number;
    supplementChain: ProcessStep[];
  }, DomainError>> {
    const flow = await this.processRepo.findById(flowId);
    if (!flow) return failure(new DomainError(`工序流 ${flowId} 不存在`, 'FLOW_NOT_FOUND'));

    const step = flow.steps.find(s => s.id === stepId);
    if (!step) return failure(new DomainError(`工序步骤 ${stepId} 不存在`, 'STEP_NOT_FOUND'));

    if (step.status !== 'running') {
      return failure(new DomainError(`工序 ${step.type} 未在运行中(当前:${step.status})，无法记录完成`, 'STEP_NOT_RUNNING'));
    }

    if (params.quantity <= 0) {
      return failure(new DomainError('完成数量必须大于0', 'INVALID_QUANTITY'));
    }

    const newCompleted = step.completedQty + params.quantity;
    const newOutput = (step.outputQty ?? 0) + params.quantity;
    const newDefect = (step.defectQty ?? 0) + (params.defectQty ?? 0);

    // 达标判定
    const isComplete = step.requiredQty != null ? newCompleted >= step.requiredQty : false;
    let shortfall = 0;
    let supplementChain: ProcessStep[] = [];

    // 如果达标，自动完成；如果不够且是最后一次（师傅标记完成），触发补产
    if (isComplete) {
      await this.advanceStep(flowId, stepId, 'done');
    } else if (params.notes?.includes('最后一轮') || params.notes?.includes('材料不够')) {
      // 师傅表示这是能完成的最大数量，触发补产
      shortfall = (step.requiredQty ?? 0) - newCompleted;
      if (shortfall > 0) {
        supplementChain = await this.requestSupplement(flowId, stepId, shortfall);
        // 标记当前步骤完成（以实际数量）
        await this.processRepo.updateCompletedQty(stepId, newCompleted, newOutput, newDefect);
        await this.advanceStep(flowId, stepId, 'done');
      }
    }

    const updated = await this.processRepo.updateCompletedQty(stepId, newCompleted, newOutput, newDefect);

    return success({ step: updated, isComplete, shortfall, supplementChain });
  }

  /** 反查补产链——当前步骤数量不够时，确定需要通知的上游步骤列表 */
  getSupplementChain(flow: ProcessFlow, deficitStepId: string): ProcessStep[] {
    const chain: ProcessStep[] = [];
    const visited = new Set<string>();

    const walk = (stepId: string) => {
      if (visited.has(stepId)) return;
      visited.add(stepId);
      const ups = this.getUpstreamSteps(flow, stepId);
      for (const up of ups) {
        if (!isTerminal(up.status)) continue; // 已完成的才需要补
        chain.push(up);
        walk(up.id);
      }
    };

    walk(deficitStepId);
    return chain;
  }

  /** 补产——数量不够时通知上游 */
  async requestSupplement(
    flowId: string,
    deficitStepId: string,
    shortfall: number,
  ): Promise<ProcessStep[]> {
    const flow = await this.processRepo.findById(flowId);
    if (!flow) return [];

    const chain = this.getSupplementChain(flow, deficitStepId);
    if (chain.length === 0) return [];

    // 重新激活上游链中所有已完成的步骤为 ready（师傅判断自己有无余量）
    for (const step of chain) {
      if (step.status === 'done') {
        // 重置为 ready，已完成的量保留（师傅判断是否需要补）
        await this.processRepo.updateStepStatus(flowId, step.id, 'ready');
      }
    }

    return chain;
  }

  /** 检查工序流是否全部完成 */
  async isFlowComplete(flowId: string): Promise<boolean> {
    const flow = await this.processRepo.findById(flowId);
    if (!flow) return false;
    return flow.steps.every(s => isTerminal(s.status));
  }
}

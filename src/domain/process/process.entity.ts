// ============================================================
// 溢彩 Production OS — 工序领域实体
// 映射自：生产排单表 — 加工工艺 / 分切/破片/直切/冲型/背胶
// ============================================================

import { ProcessType, ProcessStatus, PunchType, ProcessTemplate } from '../../shared/types';
export type { ProcessType, ProcessStatus, PunchType }; // re-export for repository imports

/** 工序节点 */
export interface ProcessStep {
  readonly id: string;
  readonly type: ProcessType;       // 工序类型
  readonly name: string;            // 工序名称
  readonly sequence: number;        // 执行顺序
  readonly status: ProcessStatus;

  // 数量需求（目标数量）
  readonly requiredQty?: number;    // 本工序需要完成的总数量
  readonly completedQty: number;    // 已分次完成累计数量

  // 材料约束
  readonly requiredMaterialSpec?: string;   // 需要的材料规格
  readonly requiredSheetSize?: string;      // 需要的片材尺寸

  // 切割参数
  readonly sliceSize?: string;      // 切片尺寸
  readonly sliceQty?: number;       // 切片数量
  readonly punchType?: PunchType;   // 冲型类型
  readonly punchQty?: number;       // 冲型数量

  // 产出
  readonly outputQty?: number;      // 实际产出数
  readonly defectQty?: number;      // 不良数

  readonly startedAt?: string;
  readonly completedAt?: string;
}

/** 工序 DAG（有向无环图，定义工序流转关系） */
export interface ProcessFlow {
  readonly id: string;
  readonly orderId: string;
  readonly steps: ProcessStep[];
  readonly edges: ProcessEdge[];    // 工序间依赖
}

/** 工序边（定义依赖关系） */
export interface ProcessEdge {
  readonly from: string;  // 上游工序 stepId
  readonly to: string;    // 下游工序 stepId
  readonly condition?: string;  // 流转条件（如"切片完成 → 冲型就绪"）
}

/** 工序状态转换 */
export interface ProcessTransition {
  readonly from: ProcessStatus;
  readonly to: ProcessStatus;
  readonly event: string;
  readonly description: string;
}

/** 创建工序输入 */
export interface CreateProcessInput {
  orderId: string;
  template: ProcessTemplate;   // 工艺组合名称
  materialSpec: string;
  sheetSize: string;
  sliceSize: string;
  sliceQty: number;
  punchType?: PunchType;
  punchSize?: string;
  punchQty?: number;
  /** 可选的额外工序增删（跟单员调整） */
  extraSteps?: ProcessType[];
  removeSteps?: ProcessType[];
}

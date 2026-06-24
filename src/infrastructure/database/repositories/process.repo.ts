// ============================================================
// 溢彩 Production OS — 工序仓储实现（SQLite）
// ============================================================

import { v4 as uuid } from 'uuid';
import { Database } from '../connection';
import { ProcessRepository, ProcessFlow, ProcessStep, ProcessEdge } from '../../../domain/process';
import { ProcessStatus } from '../../../shared/types';

const STEP_COLS = 'id, flow_id, type, name, sequence, status, required_qty, completed_qty, slice_size, slice_qty, punch_type, punch_qty, required_material_spec, required_sheet_size, output_qty, defect_qty, started_at, completed_at';

const STEP_VALUES = '?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?';

function stepParams(step: ProcessStep, flowId: string): any[] {
  return [
    step.id, flowId, step.type, step.name, step.sequence, step.status,
    step.requiredQty ?? null, step.completedQty ?? 0,
    step.sliceSize ?? null, step.sliceQty ?? null,
    step.punchType ?? null, step.punchQty ?? null,
    step.requiredMaterialSpec ?? null, step.requiredSheetSize ?? null,
    step.outputQty ?? null, step.defectQty ?? null,
    step.startedAt ?? null, step.completedAt ?? null,
  ];
}

export class SqliteProcessRepository implements ProcessRepository {
  constructor(private readonly db: Database) {}

  async createFlow(flow: ProcessFlow): Promise<ProcessFlow> {
    this.db.prepare('INSERT INTO process_flows (id, order_id) VALUES (?, ?)').run(flow.id, flow.orderId);

    const stepStmt = this.db.prepare(`INSERT INTO process_steps (${STEP_COLS}) VALUES (${STEP_VALUES})`);
    for (const step of flow.steps) {
      stepStmt.run(...stepParams(step, flow.id));
    }

    const edgeStmt = this.db.prepare('INSERT INTO process_edges (id, flow_id, from_step, to_step, condition) VALUES (?, ?, ?, ?, ?)');
    for (const edge of flow.edges) {
      edgeStmt.run(uuid(), flow.id, edge.from, edge.to, edge.condition ?? null);
    }

    return flow;
  }

  async findByOrderId(orderId: string): Promise<ProcessFlow | null> {
    const flowRow = this.db.prepare('SELECT * FROM process_flows WHERE order_id = ?').get(orderId) as any;
    if (!flowRow) return null;
    return this.loadFlow(flowRow.id, orderId);
  }

  async findById(id: string): Promise<ProcessFlow | null> {
    const flowRow = this.db.prepare('SELECT * FROM process_flows WHERE id = ?').get(id) as any;
    if (!flowRow) return null;
    return this.loadFlow(id, flowRow.order_id);
  }

  async updateStepStatus(flowId: string, stepId: string, status: ProcessStatus): Promise<ProcessStep> {
    const now = new Date().toISOString();
    if (status === 'running') {
      this.db.prepare('UPDATE process_steps SET status = ?, started_at = ? WHERE id = ? AND flow_id = ?').run(status, now, stepId, flowId);
    } else if (status === 'done') {
      this.db.prepare('UPDATE process_steps SET status = ?, completed_at = ? WHERE id = ? AND flow_id = ?').run(status, now, stepId, flowId);
    } else {
      this.db.prepare('UPDATE process_steps SET status = ? WHERE id = ? AND flow_id = ?').run(status, stepId, flowId);
    }

    const row = this.db.prepare('SELECT * FROM process_steps WHERE id = ?').get(stepId) as any;
    return this.stepToEntity(row);
  }

  /** 更新分次完成数量 */
  async updateCompletedQty(stepId: string, completedQty: number, outputQty?: number, defectQty?: number): Promise<ProcessStep> {
    this.db.prepare('UPDATE process_steps SET completed_qty = ?, output_qty = ?, defect_qty = ? WHERE id = ?')
      .run(completedQty, outputQty ?? null, defectQty ?? null, stepId);
    const row = this.db.prepare('SELECT * FROM process_steps WHERE id = ?').get(stepId) as any;
    return this.stepToEntity(row);
  }

  async appendStep(flowId: string, step: ProcessStep): Promise<ProcessFlow> {
    this.db.prepare(`INSERT INTO process_steps (${STEP_COLS}) VALUES (${STEP_VALUES})`)
      .run(...stepParams(step, flowId));
    return (await this.findById(flowId))!;
  }

  async addEdge(flowId: string, edge: { from: string; to: string; condition?: string }): Promise<ProcessFlow> {
    this.db.prepare('INSERT INTO process_edges (id, flow_id, from_step, to_step, condition) VALUES (?, ?, ?, ?, ?)')
      .run(uuid(), flowId, edge.from, edge.to, edge.condition ?? null);
    return (await this.findById(flowId))!;
  }

  async save(flow: ProcessFlow): Promise<ProcessFlow> {
    this.db.prepare('DELETE FROM process_edges WHERE flow_id = ?').run(flow.id);
    this.db.prepare('DELETE FROM process_steps WHERE flow_id = ?').run(flow.id);

    const stepStmt = this.db.prepare(`INSERT INTO process_steps (${STEP_COLS}) VALUES (${STEP_VALUES})`);
    for (const step of flow.steps) {
      stepStmt.run(...stepParams(step, flow.id));
    }

    const edgeStmt = this.db.prepare('INSERT INTO process_edges (id, flow_id, from_step, to_step, condition) VALUES (?, ?, ?, ?, ?)');
    for (const edge of flow.edges) {
      edgeStmt.run(uuid(), flow.id, edge.from, edge.to, edge.condition ?? null);
    }

    return flow;
  }

  // --- 内部方法 ---

  private loadFlow(flowId: string, orderId: string): ProcessFlow {
    const stepRows = this.db.prepare('SELECT * FROM process_steps WHERE flow_id = ? ORDER BY sequence ASC').all(flowId) as any[];
    const edgeRows = this.db.prepare('SELECT * FROM process_edges WHERE flow_id = ?').all(flowId) as any[];

    return {
      id: flowId,
      orderId,
      steps: stepRows.map((r: any) => this.stepToEntity(r)),
      edges: edgeRows.map((r: any) => ({
        from: r.from_step,
        to: r.to_step,
        condition: r.condition ?? undefined,
      })),
    };
  }

  private stepToEntity(r: any): ProcessStep {
    return {
      id: r.id,
      type: r.type,
      name: r.name,
      sequence: r.sequence,
      status: r.status,
      requiredQty: r.required_qty ?? undefined,
      completedQty: r.completed_qty ?? 0,
      sliceSize: r.slice_size ?? undefined,
      sliceQty: r.slice_qty ?? undefined,
      punchType: r.punch_type ?? undefined,
      punchQty: r.punch_qty ?? undefined,
      requiredMaterialSpec: r.required_material_spec ?? undefined,
      requiredSheetSize: r.required_sheet_size ?? undefined,
      outputQty: r.output_qty ?? undefined,
      defectQty: r.defect_qty ?? undefined,
      startedAt: r.started_at ?? undefined,
      completedAt: r.completed_at ?? undefined,
    };
  }
}

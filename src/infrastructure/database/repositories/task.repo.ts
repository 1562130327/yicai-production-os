// ============================================================
// 溢彩 Production OS — 任务仓储实现（SQLite）
// ============================================================

import { v4 as uuid } from 'uuid';
import { Database } from '../connection';
import { TaskRepository, Task, CreateTaskInput, AssignTaskInput } from '../../../domain/task';
import { TaskStatus } from '../../../shared/types';

export class SqliteTaskRepository implements TaskRepository {
  constructor(private readonly db: Database) {}

  async create(input: CreateTaskInput): Promise<Task> {
    const task: Task = {
      id: uuid(),
      orderId: input.orderId,
      processStepId: input.processStepId,
      processType: input.processType,
      status: 'queued',
      priority: input.priority,
      estimatedHours: input.estimatedHours,
      quantity: input.quantity,
      completedQty: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.db.prepare(`
      INSERT INTO tasks (id, order_id, process_step_id, process_type, status, priority, estimated_hours, quantity, completed_qty, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(task.id, task.orderId, task.processStepId, task.processType, task.status, task.priority,
      task.estimatedHours, task.quantity, task.completedQty, task.createdAt, task.updatedAt);

    return task;
  }

  async findById(id: string): Promise<Task | null> {
    const row = this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    return row ? this.toEntity(row) : null;
  }

  async findByOrder(orderId: string): Promise<Task[]> {
    const rows = this.db.prepare('SELECT * FROM tasks WHERE order_id = ? ORDER BY created_at ASC').all(orderId) as any[];
    return rows.map(r => this.toEntity(r));
  }

  async findByWorker(worker: string, status?: TaskStatus): Promise<Task[]> {
    let sql = 'SELECT * FROM tasks WHERE assigned_worker = ?';
    const params: any[] = [worker];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map(r => this.toEntity(r));
  }

  async findByMachine(machineId: string, status?: TaskStatus): Promise<Task[]> {
    let sql = 'SELECT * FROM tasks WHERE machine_id = ?';
    const params: any[] = [machineId];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map(r => this.toEntity(r));
  }

  async assign(id: string, input: AssignTaskInput): Promise<Task> {
    this.db.prepare(`
      UPDATE tasks SET assigned_worker = ?, machine_id = ?, status = 'assigned', scheduled_at = ?, updated_at = ?
      WHERE id = ?
    `).run(input.worker, input.machineId, input.scheduledAt ?? new Date().toISOString(),
      new Date().toISOString(), id);
    return (await this.findById(id))!;
  }

  async start(id: string): Promise<Task> {
    this.db.prepare("UPDATE tasks SET status = 'running', started_at = ?, updated_at = ? WHERE id = ?")
      .run(new Date().toISOString(), new Date().toISOString(), id);
    return (await this.findById(id))!;
  }

  async complete(id: string, completedQty: number): Promise<Task> {
    this.db.prepare("UPDATE tasks SET status = 'completed', completed_qty = ?, completed_at = ?, updated_at = ? WHERE id = ?")
      .run(completedQty, new Date().toISOString(), new Date().toISOString(), id);
    return (await this.findById(id))!;
  }

  async fail(id: string, reason: string): Promise<Task> {
    this.db.prepare("UPDATE tasks SET status = 'failed', notes = ?, updated_at = ? WHERE id = ?")
      .run(reason, new Date().toISOString(), id);
    return (await this.findById(id))!;
  }

  async findQueued(): Promise<Task[]> {
    const rows = this.db.prepare("SELECT * FROM tasks WHERE status = 'queued' ORDER BY priority DESC, created_at ASC").all() as any[];
    return rows.map(r => this.toEntity(r));
  }

  async findRunning(): Promise<Task[]> {
    const rows = this.db.prepare("SELECT * FROM tasks WHERE status IN ('assigned', 'running') ORDER BY started_at ASC").all() as any[];
    return rows.map(r => this.toEntity(r));
  }

  async save(task: Task): Promise<Task> {
    this.db.prepare(`
      UPDATE tasks SET order_id = ?, process_step_id = ?, process_type = ?, assigned_worker = ?, machine_id = ?,
        status = ?, priority = ?, estimated_hours = ?, actual_hours = ?, quantity = ?, completed_qty = ?,
        notes = ?, scheduled_at = ?, started_at = ?, completed_at = ?, updated_at = ?
      WHERE id = ?
    `).run(task.orderId, task.processStepId, task.processType, task.assignedWorker ?? null, task.machineId ?? null,
      task.status, task.priority, task.estimatedHours, task.actualHours ?? null, task.quantity, task.completedQty ?? 0,
      task.notes ?? null, task.scheduledAt ?? null, task.startedAt ?? null, task.completedAt ?? null,
      new Date().toISOString(), task.id);
    return task;
  }

  private toEntity(r: any): Task {
    return {
      id: r.id,
      orderId: r.order_id,
      processStepId: r.process_step_id,
      processType: r.process_type,
      assignedWorker: r.assigned_worker ?? undefined,
      machineId: r.machine_id ?? undefined,
      status: r.status,
      priority: r.priority,
      estimatedHours: r.estimated_hours,
      actualHours: r.actual_hours ?? undefined,
      quantity: r.quantity,
      completedQty: r.completed_qty ?? 0,
      notes: r.notes ?? undefined,
      scheduledAt: r.scheduled_at ?? undefined,
      startedAt: r.started_at ?? undefined,
      completedAt: r.completed_at ?? undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }
}

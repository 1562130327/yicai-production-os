// ============================================================
// 溢彩 Production OS — 订单仓储实现（SQLite）
// ============================================================

import { v4 as uuid } from 'uuid';
import { Database } from '../connection';
import { OrderRepository, Order, CreateOrderInput, UpdateOrderProgress } from '../../../domain/order';
import { OrderStatus, PaginatedResult, Pagination } from '../../../shared/types';

export class SqliteOrderRepository implements OrderRepository {
  constructor(private readonly db: Database) {}

  async create(input: CreateOrderInput): Promise<Order> {
    const order: Order = {
      id: uuid(),
      code: input.code,
      productCode: input.productCode,
      customerName: input.customerName,
      category: input.category,
      processTemplate: input.processTemplate,
      priority: input.priority ?? 'normal',
      status: 'pending',
      materialSpec: input.materialSpec,
      sheetSize: input.sheetSize,
      sliceSize: input.sliceSize,
      sliceQty: input.sliceQty,
      punchType: input.punchType,
      punchSize: input.punchSize,
      punchQty: input.punchQty,
      sheetOpened: 0,
      sheetCut: 0,
      punched: 0,
      dimensions: input.dimensions ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const stmt = this.db.prepare(`
      INSERT INTO orders (id, code, product_code, customer_name, category, process_type,
        priority, status, material_spec, sheet_size, slice_size, slice_qty,
        punch_type, punch_size, punch_qty, sheet_opened, sheet_cut, punched, dimensions, created_at, updated_at)
      VALUES (@id, @code, @productCode, @customerName, @category, @processTemplate,
        @priority, @status, @materialSpec, @sheetSize, @sliceSize, @sliceQty,
        @punchType, @punchSize, @punchQty, @sheetOpened, @sheetCut, @punched, @dimensions, @createdAt, @updatedAt)
    `);

    stmt.run(this.toRow(order));
    return order;
  }

  async findById(id: string): Promise<Order | null> {
    const row = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    return row ? this.toEntity(row) : null;
  }

  async findByCode(code: string): Promise<Order | null> {
    const row = this.db.prepare('SELECT * FROM orders WHERE code = ?').get(code) as any;
    return row ? this.toEntity(row) : null;
  }

  async findByStatus(status: OrderStatus, pagination?: Pagination): Promise<PaginatedResult<Order>> {
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const countRow = this.db.prepare('SELECT COUNT(*) as total FROM orders WHERE status = ?').get(status) as any;
    const rows = this.db.prepare('SELECT * FROM orders WHERE status = ? LIMIT ? OFFSET ?').all(status, pageSize, offset) as any[];

    return {
      items: rows.map(r => this.toEntity(r)),
      total: countRow.total,
      page,
      pageSize,
      totalPages: Math.ceil(countRow.total / pageSize),
    };
  }

  async findByCustomer(customerName: string, pagination?: Pagination): Promise<PaginatedResult<Order>> {
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const countRow = this.db.prepare('SELECT COUNT(*) as total FROM orders WHERE customer_name LIKE ?').get(`%${customerName}%`) as any;
    const rows = this.db.prepare('SELECT * FROM orders WHERE customer_name LIKE ? LIMIT ? OFFSET ?').all(`%${customerName}%`, pageSize, offset) as any[];

    return {
      items: rows.map(r => this.toEntity(r)),
      total: countRow.total,
      page,
      pageSize,
      totalPages: Math.ceil(countRow.total / pageSize),
    };
  }

  async search(keyword: string, pagination?: Pagination): Promise<PaginatedResult<Order>> {
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    const like = `%${keyword}%`;

    const countRow = this.db.prepare(
      `SELECT COUNT(*) as total FROM orders WHERE code LIKE ? OR product_code LIKE ? OR customer_name LIKE ?`
    ).get(like, like, like) as any;
    const rows = this.db.prepare(
      `SELECT * FROM orders WHERE code LIKE ? OR product_code LIKE ? OR customer_name LIKE ? LIMIT ? OFFSET ?`
    ).all(like, like, like, pageSize, offset) as any[];

    return {
      items: rows.map(r => this.toEntity(r)),
      total: countRow.total,
      page,
      pageSize,
      totalPages: Math.ceil(countRow.total / pageSize),
    };
  }

  async updateProgress(id: string, progress: UpdateOrderProgress): Promise<Order> {
    const sets: string[] = ['updated_at = datetime(\'now\')'];
    const vals: any[] = [];

    if (progress.sheetOpened !== undefined) { sets.push('sheet_opened = ?'); vals.push(progress.sheetOpened); }
    if (progress.sheetCut !== undefined) { sets.push('sheet_cut = ?'); vals.push(progress.sheetCut); }
    if (progress.punched !== undefined) { sets.push('punched = ?'); vals.push(progress.punched); }
    if (progress.status !== undefined) { sets.push('status = ?'); vals.push(progress.status); }

    vals.push(id);
    this.db.prepare(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
    return (await this.findById(id))!;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    this.db.prepare('UPDATE orders SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(status, id);
    return (await this.findById(id))!;
  }

  async findActive(): Promise<Order[]> {
    const rows = this.db.prepare(
      'SELECT * FROM orders WHERE status NOT IN (\'completed\', \'cancelled\') ORDER BY created_at DESC'
    ).all() as any[];
    return rows.map(r => this.toEntity(r));
  }

  async countByStatus(status: OrderStatus): Promise<number> {
    const row = this.db.prepare('SELECT COUNT(*) as total FROM orders WHERE status = ?').get(status) as any;
    return row.total;
  }

  async save(order: Order): Promise<Order> {
    this.db.prepare(`
      UPDATE orders SET code=@code, product_code=@productCode, customer_name=@customerName,
        category=@category, process_type=@processTemplate, priority=@priority, status=@status,
        sheet_opened=@sheetOpened, sheet_cut=@sheetCut, punched=@punched,
        updated_at=datetime('now') WHERE id=@id
    `).run(this.toRow(order));
    return order;
  }

  // --- 映射方法 ---
  private toRow(o: Order): any {
    return {
      id: o.id, code: o.code, productCode: o.productCode, customerName: o.customerName,
      category: o.category, processTemplate: o.processTemplate, priority: o.priority,
      status: o.status, materialSpec: o.materialSpec, sheetSize: o.sheetSize,
      sliceSize: o.sliceSize, sliceQty: o.sliceQty, punchType: o.punchType ?? null,
      punchSize: o.punchSize ?? null, punchQty: o.punchQty ?? null,
      sheetOpened: o.sheetOpened, sheetCut: o.sheetCut,
      punched: o.punched, dimensions: JSON.stringify(o.dimensions ?? []),
      createdAt: o.createdAt, updatedAt: o.updatedAt,
    };
  }

  private toEntity(row: any): Order {
    return {
      id: row.id,
      code: row.code,
      productCode: row.product_code,
      customerName: row.customer_name,
      category: row.category,
      processTemplate: row.process_type,
      priority: row.priority,
      status: row.status,
      materialSpec: row.material_spec,
      sheetSize: row.sheet_size,
      sliceSize: row.slice_size,
      sliceQty: row.slice_qty,
      punchType: row.punch_type ?? undefined,
      punchSize: row.punch_size ?? undefined,
      punchQty: row.punch_qty ?? undefined,
      sheetOpened: row.sheet_opened,
      sheetCut: row.sheet_cut,
      punched: row.punched,
      dimensions: JSON.parse(row.dimensions || '[]'),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

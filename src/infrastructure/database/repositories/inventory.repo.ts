// ============================================================
// 溢彩 Production OS — 库存仓储实现（SQLite）
// ============================================================

import { v4 as uuid } from 'uuid';
import { Database } from '../connection';
import { InventoryRepository, InventoryBatch, InventoryTransaction, DeductInventoryInput } from '../../../domain/inventory';

export class SqliteInventoryRepository implements InventoryRepository {
  constructor(private readonly db: Database) {}

  async findById(id: string): Promise<InventoryBatch | null> {
    const row = this.db.prepare('SELECT * FROM inventory_batches WHERE id = ?').get(id) as any;
    return row ? this.batchToEntity(row) : null;
  }

  async findByMaterialSpec(spec: string): Promise<InventoryBatch[]> {
    const rows = this.db.prepare('SELECT * FROM inventory_batches WHERE material_spec = ? ORDER BY last_inbound_at DESC').all(spec) as any[];
    return rows.map(r => this.batchToEntity(r));
  }

  async findAvailable(spec: string, minQty: number): Promise<InventoryBatch[]> {
    const rows = this.db.prepare('SELECT * FROM inventory_batches WHERE material_spec = ? AND remaining_qty > ? ORDER BY last_inbound_at DESC')
      .all(spec, minQty) as any[];
    return rows.map(r => this.batchToEntity(r));
  }

  async deduct(input: DeductInventoryInput): Promise<InventoryBatch> {
    const batch = await this.findById(input.batchId);
    if (!batch) throw new Error(`批次 ${input.batchId} 不存在`);
    if (batch.remainingQty < input.quantity) throw new Error(`批次 ${input.batchId} 库存不足`);

    const newQty = batch.remainingQty - input.quantity;
    this.db.prepare('UPDATE inventory_batches SET remaining_qty = ?, updated_at = ? WHERE id = ?')
      .run(newQty, new Date().toISOString(), input.batchId);

    // 自动记交易
    await this.logTransaction({
      batchId: input.batchId,
      type: 'outbound',
      quantity: input.quantity,
      orderId: input.orderId,
      reason: input.reason,
    });

    return (await this.findById(input.batchId))!;
  }

  async inbound(batchId: string, quantity: number, reason: string): Promise<InventoryBatch> {
    const batch = await this.findById(batchId);
    if (!batch) throw new Error(`批次 ${batchId} 不存在`);

    const newQty = batch.remainingQty + quantity;
    this.db.prepare('UPDATE inventory_batches SET remaining_qty = ?, inbound_week = inbound_week + ?, last_inbound_at = ?, updated_at = ? WHERE id = ?')
      .run(newQty, quantity, new Date().toISOString(), new Date().toISOString(), batchId);

    await this.logTransaction({ batchId, type: 'inbound', quantity, reason });

    return (await this.findById(batchId))!;
  }

  async release(orderId: string, batchId: string, quantity: number): Promise<InventoryBatch> {
    const batch = await this.findById(batchId);
    if (!batch) throw new Error(`批次 ${batchId} 不存在`);

    const newQty = batch.remainingQty + quantity;
    this.db.prepare('UPDATE inventory_batches SET remaining_qty = ?, updated_at = ? WHERE id = ?')
      .run(newQty, new Date().toISOString(), batchId);

    await this.logTransaction({ batchId, type: 'released', quantity, orderId, reason: `订单 ${orderId} 取消，释放预留` });

    return (await this.findById(batchId))!;
  }

  async getTotalAvailable(spec: string): Promise<number> {
    const row = this.db.prepare('SELECT COALESCE(SUM(remaining_qty), 0) as total FROM inventory_batches WHERE material_spec = ?')
      .get(spec) as any;
    return row.total;
  }

  async logTransaction(tx: Omit<InventoryTransaction, 'id' | 'timestamp'>): Promise<InventoryTransaction> {
    const record: InventoryTransaction = {
      id: uuid(),
      ...tx,
      timestamp: new Date().toISOString(),
    };

    this.db.prepare(`
      INSERT INTO inventory_transactions (id, batch_id, type, quantity, order_id, reason, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(record.id, record.batchId, record.type, record.quantity, record.orderId ?? null, record.reason, record.timestamp);

    return record;
  }

  async getTransactions(batchId: string): Promise<InventoryTransaction[]> {
    const rows = this.db.prepare('SELECT * FROM inventory_transactions WHERE batch_id = ? ORDER BY timestamp DESC').all(batchId) as any[];
    return rows.map(r => this.txToEntity(r));
  }

  async create(input: Omit<InventoryBatch, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryBatch> {
    const batch: InventoryBatch = {
      id: uuid(),
      ...input,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.db.prepare(`
      INSERT INTO inventory_batches (id, batch_no, material_spec, info, supplier_name, supplier_info, remaining_qty, unit, color, batch_width, price, inbound_week, last_inbound_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(batch.id, batch.batchNo, batch.materialSpec, batch.info, batch.supplierName, batch.supplierInfo,
      batch.remainingQty, batch.unit, batch.color, batch.batchWidth, batch.price,
      batch.inboundWeek, batch.lastInboundAt, batch.createdAt, batch.updatedAt);

    return batch;
  }

  async save(batch: InventoryBatch): Promise<InventoryBatch> {
    this.db.prepare(`
      UPDATE inventory_batches SET batch_no = ?, material_spec = ?, info = ?, supplier_name = ?, supplier_info = ?,
        remaining_qty = ?, unit = ?, color = ?, batch_width = ?, price = ?, inbound_week = ?, last_inbound_at = ?, updated_at = ?
      WHERE id = ?
    `).run(batch.batchNo, batch.materialSpec, batch.info, batch.supplierName, batch.supplierInfo,
      batch.remainingQty, batch.unit, batch.color, batch.batchWidth, batch.price,
      batch.inboundWeek, batch.lastInboundAt, new Date().toISOString(), batch.id);
    return batch;
  }

  // --- 映射 ---

  private batchToEntity(r: any): InventoryBatch {
    return {
      id: r.id,
      batchNo: r.batch_no,
      materialSpec: r.material_spec,
      info: r.info,
      supplierName: r.supplier_name,
      supplierInfo: r.supplier_info,
      remainingQty: r.remaining_qty,
      unit: r.unit,
      color: r.color || '',
      batchWidth: r.batch_width || 0,
      price: r.price || 0,
      inboundWeek: r.inbound_week,
      lastInboundAt: r.last_inbound_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  private txToEntity(r: any): InventoryTransaction {
    return {
      id: r.id,
      batchId: r.batch_id,
      type: r.type,
      quantity: r.quantity,
      orderId: r.order_id ?? undefined,
      reason: r.reason,
      timestamp: r.timestamp,
    };
  }
}

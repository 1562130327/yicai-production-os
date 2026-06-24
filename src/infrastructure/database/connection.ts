// ============================================================
// 溢彩 Production OS — SQLite 数据库连接（基于 sql.js）
// sql.js 是纯 JS/WASM 实现，无需原生编译
// ============================================================

import initSqlJs, { Database as SqlJsDatabase, Statement as SqlJsStatement, SqlJsStatic } from 'sql.js';
import path from 'path';
import fs from 'fs';

// ============================================================
// sql.js → better-sqlite3 适配层
// ============================================================

/** 模拟 better-sqlite3 Statement 接口 */
export class Statement {
  constructor(
    private readonly stmt: SqlJsStatement,
    private readonly sql: string,
  ) {}

  /** sql.js bind: 单对象→命名参数，多参数/数组→位置参数 */
  private doBind(params: any[]): void {
    if (params.length === 0) {
      this.stmt.bind([]);
    } else if (params.length === 1 && params[0] !== null && typeof params[0] === 'object' && !Array.isArray(params[0])) {
      // 命名参数：{id: '...', code: '...'} → 给 key 加 @ 前缀，undefined→null
      const named: Record<string, any> = {};
      for (const [k, v] of Object.entries(params[0])) {
        named['@' + k] = v === undefined ? null : v;
      }
      this.stmt.bind(named);
    } else {
      // 位置参数：[val1, val2, ...] → undefined→null
      const cleaned = params.map(v => v === undefined ? null : v);
      this.stmt.bind(cleaned);
    }
  }

  run(...params: any[]): void {
    this.doBind(params);
    this.stmt.step();
    this.stmt.reset(); queryCount++;
  }

  get(...params: any[]): Record<string, any> | undefined {
    this.doBind(params);
    let row: Record<string, any> | undefined;
    if (this.stmt.step()) {
      row = this.stmt.getAsObject();
    }
    this.stmt.reset(); queryCount++;
    return row;
  }

  all(...params: any[]): Record<string, any>[] {
    this.doBind(params);
    const rows: Record<string, any>[] = [];
    while (this.stmt.step()) {
      rows.push(this.stmt.getAsObject());
    }
    this.stmt.reset(); queryCount++;
    return rows;
  }

  /** 释放语句资源（不再使用时调用） */
  free(): void {
    this.stmt.free();
  }
}

/** 模拟 better-sqlite3 Database 接口 */
export class Database {
  constructor(private readonly db: SqlJsDatabase) {}

  prepare(sql: string): Statement {
    const stmt = this.db.prepare(sql);
    return new Statement(stmt, sql);
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  /** 导出数据库二进制（用于保存到磁盘） */
  export(): Uint8Array {
    return this.db.export();
  }

  close(): void {
    this.db.close();
  }
}

// ============================================================
// 连接管理
// ============================================================

let db: Database | null = null;
let SQL: SqlJsStatic | null = null;
let queryCount = 0;
const GC_THRESHOLD = 50_000; // 每5万次查询触发WASM内存回收

/** 初始化 sql.js（加载 WASM，仅首次调用需要） */
export async function initSql(): Promise<SqlJsStatic> {
  if (SQL) return SQL;
  SQL = await initSqlJs();
  return SQL;
}

/** 获取数据库连接 */
export async function getConnection(dbPath?: string): Promise<Database> {
  if (db) return db;

  if (!SQL) {
    SQL = await initSql();
  }

  const resolvedPath = dbPath ?? path.resolve(__dirname, '../../../data/production.db');

  // 确保目录存在
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 尝试从磁盘加载已有数据库，否则创建新数据库
  if (fs.existsSync(resolvedPath)) {
    const buffer = fs.readFileSync(resolvedPath);
    db = new Database(new SQL.Database(buffer));
  } else {
    db = new Database(new SQL.Database());
  }

  // 启用外键
  db.exec('PRAGMA foreign_keys = ON');

  initializeSchema(db);

  // 定期自动保存到磁盘（每30秒）
  startAutoSave(resolvedPath);

  return db;
}

/** 保存数据库到磁盘 */
export function saveToDisk(filePath?: string): void {
  if (!db) return;
  const resolvedPath = filePath ?? path.resolve(__dirname, '../../../data/production.db');
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const data = db.export();
  fs.writeFileSync(resolvedPath, Buffer.from(data));
}

let autoSaveInterval: ReturnType<typeof setInterval> | null = null;

function startAutoSave(filePath: string): void {
  if (autoSaveInterval) return;
  autoSaveInterval = setInterval(() => {
    try {
      saveToDisk(filePath);
    } catch (e) {
      console.error('[AutoSave] 保存失败:', (e as Error).message);
    }
  }, 30_000);
}

export function closeConnection(): void {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
  saveToDisk();
  if (db) {
    db.close();
    db = null;
  }
}

// ============================================================
// 表结构初始化
// ============================================================

function initializeSchema(database: Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      product_code TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      category TEXT NOT NULL,
      process_type TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'normal',
      status TEXT NOT NULL DEFAULT 'pending',
      material_spec TEXT NOT NULL,
      sheet_size TEXT NOT NULL,
      slice_size TEXT NOT NULL,
      slice_qty INTEGER NOT NULL,
      punch_type TEXT,
      punch_size TEXT,
      punch_qty INTEGER,
      sheet_opened INTEGER NOT NULL DEFAULT 0,
      sheet_cut INTEGER NOT NULL DEFAULT 0,
      punched INTEGER NOT NULL DEFAULT 0,
      dimensions TEXT DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS process_flows (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL UNIQUE,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS process_steps (
      id TEXT PRIMARY KEY,
      flow_id TEXT NOT NULL,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      sequence INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'waiting',
      required_qty INTEGER,
      completed_qty INTEGER DEFAULT 0,
      slice_size TEXT,
      slice_qty INTEGER,
      punch_type TEXT,
      punch_size TEXT,
      punch_qty INTEGER,
      required_material_spec TEXT,
      required_sheet_size TEXT,
      output_qty INTEGER,
      defect_qty INTEGER,
      started_at TEXT,
      completed_at TEXT,
      FOREIGN KEY (flow_id) REFERENCES process_flows(id)
    );

    CREATE TABLE IF NOT EXISTS process_edges (
      id TEXT PRIMARY KEY,
      flow_id TEXT NOT NULL,
      from_step TEXT NOT NULL,
      to_step TEXT NOT NULL,
      condition TEXT,
      FOREIGN KEY (flow_id) REFERENCES process_flows(id)
    );

    CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      spec TEXT NOT NULL UNIQUE,
      info TEXT NOT NULL DEFAULT '',
      sheet_size TEXT NOT NULL,
      loss_rate REAL NOT NULL DEFAULT 0.05,
      unit TEXT NOT NULL DEFAULT '片',
      color TEXT DEFAULT '',
      material_width REAL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inventory_batches (
      id TEXT PRIMARY KEY,
      batch_no TEXT NOT NULL,
      material_spec TEXT NOT NULL,
      info TEXT NOT NULL DEFAULT '',
      supplier_name TEXT NOT NULL DEFAULT '',
      supplier_info TEXT NOT NULL DEFAULT '',
      remaining_qty REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT '片',
      color TEXT DEFAULT '',
      batch_width REAL DEFAULT 0,
      price REAL DEFAULT 0,
      inbound_week REAL NOT NULL DEFAULT 0,
      last_inbound_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      order_id TEXT,
      reason TEXT NOT NULL DEFAULT '',
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (batch_id) REFERENCES inventory_batches(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      process_step_id TEXT NOT NULL,
      process_type TEXT NOT NULL,
      assigned_worker TEXT,
      machine_id TEXT,
      status TEXT NOT NULL DEFAULT 'queued',
      priority TEXT NOT NULL DEFAULT 'normal',
      estimated_hours REAL NOT NULL DEFAULT 0,
      actual_hours REAL,
      quantity INTEGER NOT NULL DEFAULT 0,
      completed_qty INTEGER DEFAULT 0,
      notes TEXT,
      scheduled_at TEXT,
      started_at TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS trace_events (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      process_type TEXT,
      process_status TEXT,
      from_process TEXT,
      to_process TEXT,
      task_id TEXT,
      worker TEXT,
      machine_id TEXT,
      material_batch_id TEXT,
      metadata TEXT NOT NULL DEFAULT '{}',
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS anomaly_events (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      process_step_id TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'medium',
      detected_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT,
      resolution TEXT,
      trigger_supplement INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS supplement_records (
      id TEXT PRIMARY KEY,
      original_order_id TEXT NOT NULL,
      supplement_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_code ON orders(code);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_worker ON tasks(assigned_worker);
    CREATE INDEX IF NOT EXISTS idx_trace_events_order ON trace_events(order_id);
    CREATE INDEX IF NOT EXISTS idx_trace_events_batch ON trace_events(material_batch_id);
    CREATE INDEX IF NOT EXISTS idx_inventory_spec ON inventory_batches(material_spec);

    -- 分次完成记录
    CREATE TABLE IF NOT EXISTS completion_records (
      id TEXT PRIMARY KEY,
      step_id TEXT NOT NULL,
      worker TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      defect_qty INTEGER DEFAULT 0,
      notes TEXT DEFAULT '',
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (step_id) REFERENCES process_steps(id)
    );
    CREATE INDEX IF NOT EXISTS idx_completion_step ON completion_records(step_id);

    -- 机器表
    CREATE TABLE IF NOT EXISTS machines (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'idle',
      process_types TEXT NOT NULL DEFAULT '[]',
      workshop TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 工人表
    CREATE TABLE IF NOT EXISTS workers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      skills TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'active',
      phone TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 客户表
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      level TEXT DEFAULT 'normal',
      payment_cycle TEXT DEFAULT '',
      address TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 工艺模板表
    CREATE TABLE IF NOT EXISTS process_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      steps TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // 向后兼容：补充旧表缺少的列
  const migrateColumns = [
    'ALTER TABLE process_steps ADD COLUMN required_qty INTEGER',
    'ALTER TABLE process_steps ADD COLUMN completed_qty INTEGER DEFAULT 0',
    'ALTER TABLE process_steps ADD COLUMN slice_size TEXT',
    'ALTER TABLE process_steps ADD COLUMN slice_qty INTEGER',
    'ALTER TABLE process_steps ADD COLUMN punch_type TEXT',
    'ALTER TABLE process_steps ADD COLUMN punch_qty INTEGER',
    'ALTER TABLE process_steps ADD COLUMN required_material_spec TEXT',
    'ALTER TABLE process_steps ADD COLUMN required_sheet_size TEXT',
    'ALTER TABLE orders ADD COLUMN punch_size TEXT',
    'ALTER TABLE process_steps ADD COLUMN punch_size TEXT',
    'ALTER TABLE orders ADD COLUMN dimensions TEXT DEFAULT \'[]\'',
    'ALTER TABLE inventory_batches ADD COLUMN color TEXT DEFAULT \'\'',
    'ALTER TABLE inventory_batches ADD COLUMN batch_width REAL DEFAULT 0',
    'ALTER TABLE inventory_batches ADD COLUMN price REAL DEFAULT 0',
    'ALTER TABLE materials ADD COLUMN color TEXT DEFAULT \'\'',
    'ALTER TABLE materials ADD COLUMN material_width REAL DEFAULT 0',
  ];
  for (const sql of migrateColumns) {
    try { database.exec(sql); } catch (e: any) {
      if (!e?.message?.includes('duplicate column')) {
        console.error('[Migration] 迁移失败:', sql, e?.message ?? e);
      }
    }
  }
}

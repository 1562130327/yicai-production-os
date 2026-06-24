import { v4 as uuid } from 'uuid';
import { Database } from '../connection';
import { MachineRepository, Machine } from '../../../domain/machine';

export class SqliteMachineRepository implements MachineRepository {
  constructor(private readonly db: Database) {}
  async findById(id: string): Promise<Machine | null> {
    const row = this.db.prepare('SELECT * FROM machines WHERE id = ?').get(id) as any;
    return row ? this.toEntity(row) : null;
  }
  async findAll(): Promise<Machine[]> {
    const rows = this.db.prepare('SELECT * FROM machines ORDER BY name').all() as any[];
    return rows.map(r => this.toEntity(r));
  }
  async findByStatus(status: string): Promise<Machine[]> {
    const rows = this.db.prepare('SELECT * FROM machines WHERE status = ?').all(status) as any[];
    return rows.map(r => this.toEntity(r));
  }
  async updateStatus(id: string, status: string): Promise<Machine> {
    this.db.prepare("UPDATE machines SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
    return (await this.findById(id))!;
  }
  async create(input: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>): Promise<Machine> {
    const m: Machine = { id: uuid(), ...input, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.db.prepare('INSERT INTO machines (id, code, name, type, status, process_types, workshop, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(m.id, m.code, m.name, m.type, m.status, JSON.stringify(m.processTypes), m.workshop, m.createdAt, m.updatedAt);
    return m;
  }
  private toEntity(r: any): Machine {
    return { id: r.id, code: r.code, name: r.name, type: r.type, status: r.status, processTypes: JSON.parse(r.process_types||'[]'), workshop: r.workshop||'', createdAt: r.created_at, updatedAt: r.updated_at };
  }
}

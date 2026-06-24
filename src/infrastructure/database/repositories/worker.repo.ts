import { v4 as uuid } from 'uuid';
import { Database } from '../connection';
import { WorkerRepository, Worker } from '../../../domain/worker';

export class SqliteWorkerRepository implements WorkerRepository {
  constructor(private readonly db: Database) {}
  async findById(id: string): Promise<Worker | null> {
    const row = this.db.prepare('SELECT * FROM workers WHERE id = ?').get(id) as any;
    return row ? this.toEntity(row) : null;
  }
  async findAll(): Promise<Worker[]> {
    const rows = this.db.prepare('SELECT * FROM workers ORDER BY name').all() as any[];
    return rows.map(r => this.toEntity(r));
  }
  async findByRole(role: string): Promise<Worker[]> {
    const rows = this.db.prepare('SELECT * FROM workers WHERE role = ?').all(role) as any[];
    return rows.map(r => this.toEntity(r));
  }
  async updateStatus(id: string, status: string): Promise<Worker> {
    this.db.prepare("UPDATE workers SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
    return (await this.findById(id))!;
  }
  async create(input: Omit<Worker, 'id' | 'createdAt' | 'updatedAt'>): Promise<Worker> {
    const w: Worker = { id: uuid(), ...input, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.db.prepare('INSERT INTO workers (id, name, role, skills, status, phone, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(w.id, w.name, w.role, JSON.stringify(w.skills), w.status, w.phone, w.createdAt, w.updatedAt);
    return w;
  }
  private toEntity(r: any): Worker {
    return { id: r.id, name: r.name, role: r.role, skills: JSON.parse(r.skills||'[]'), status: r.status, phone: r.phone||'', createdAt: r.created_at, updatedAt: r.updated_at };
  }
}

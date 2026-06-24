import { v4 as uuid } from 'uuid';
import { Database } from '../connection';
import { CustomerRepository, Customer } from '../../../domain/customer';

export class SqliteCustomerRepository implements CustomerRepository {
  constructor(private readonly db: Database) {}
  async findById(id: string): Promise<Customer | null> {
    const row = this.db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as any;
    return row ? this.toEntity(row) : null;
  }
  async findAll(): Promise<Customer[]> {
    const rows = this.db.prepare('SELECT * FROM customers ORDER BY name').all() as any[];
    return rows.map(r => this.toEntity(r));
  }
  async search(keyword: string): Promise<Customer[]> {
    const rows = this.db.prepare('SELECT * FROM customers WHERE name LIKE ? OR contact LIKE ? ORDER BY name').all(`%${keyword}%`, `%${keyword}%`) as any[];
    return rows.map(r => this.toEntity(r));
  }
  async create(input: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const c: Customer = { id: uuid(), ...input, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.db.prepare('INSERT INTO customers (id, name, contact, phone, level, payment_cycle, address, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(c.id, c.name, c.contact, c.phone, c.level, c.paymentCycle, c.address, c.notes, c.createdAt, c.updatedAt);
    return c;
  }
  async update(id: string, input: Partial<Customer>): Promise<Customer> {
    const sets = ['updated_at = datetime(\'now\')']; const vals: any[] = [];
    if (input.name !== undefined) { sets.push('name = ?'); vals.push(input.name); }
    if (input.contact !== undefined) { sets.push('contact = ?'); vals.push(input.contact); }
    if (input.phone !== undefined) { sets.push('phone = ?'); vals.push(input.phone); }
    if (input.level !== undefined) { sets.push('level = ?'); vals.push(input.level); }
    if (input.paymentCycle !== undefined) { sets.push('payment_cycle = ?'); vals.push(input.paymentCycle); }
    if (input.address !== undefined) { sets.push('address = ?'); vals.push(input.address); }
    if (input.notes !== undefined) { sets.push('notes = ?'); vals.push(input.notes); }
    vals.push(id);
    this.db.prepare(`UPDATE customers SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
    return (await this.findById(id))!;
  }
  async delete(id: string): Promise<void> {
    this.db.prepare('DELETE FROM customers WHERE id = ?').run(id);
  }
  private toEntity(r: any): Customer {
    return { id: r.id, name: r.name, contact: r.contact||'', phone: r.phone||'', level: r.level||'normal', paymentCycle: r.payment_cycle||'', address: r.address||'', notes: r.notes||'', createdAt: r.created_at, updatedAt: r.updated_at };
  }
}

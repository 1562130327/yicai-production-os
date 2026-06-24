// ============================================================
// 溢彩 Production OS — 材料仓储实现（SQLite）
// ============================================================

import { v4 as uuid } from 'uuid';
import { Database } from '../connection';
import { MaterialRepository, Material } from '../../../domain/material';

export class SqliteMaterialRepository implements MaterialRepository {
  constructor(private readonly db: Database) {}

  async findBySpec(spec: string): Promise<Material | null> {
    const row = this.db.prepare('SELECT * FROM materials WHERE spec = ?').get(spec) as any;
    return row ? this.toEntity(row) : null;
  }

  async findById(id: string): Promise<Material | null> {
    const row = this.db.prepare('SELECT * FROM materials WHERE id = ?').get(id) as any;
    return row ? this.toEntity(row) : null;
  }

  async findAll(): Promise<Material[]> {
    const rows = this.db.prepare('SELECT * FROM materials ORDER BY spec ASC').all() as any[];
    return rows.map(r => this.toEntity(r));
  }

  async searchSpec(keyword: string): Promise<Material[]> {
    const rows = this.db.prepare('SELECT * FROM materials WHERE spec LIKE ? ORDER BY spec ASC').all(`%${keyword}%`) as any[];
    return rows.map(r => this.toEntity(r));
  }

  async create(input: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>): Promise<Material> {
    const material: Material = {
      id: uuid(),
      ...input,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.db.prepare(`
      INSERT INTO materials (id, spec, info, sheet_size, loss_rate, unit, color, material_width, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(material.id, material.spec, material.info, material.sheetSize, material.lossRate, material.unit,
      material.color, material.materialWidth, material.createdAt, material.updatedAt);

    return material;
  }

  async updateLossRate(id: string, lossRate: number): Promise<Material> {
    this.db.prepare('UPDATE materials SET loss_rate = ?, updated_at = ? WHERE id = ?')
      .run(lossRate, new Date().toISOString(), id);
    return (await this.findById(id))!;
  }

  async save(material: Material): Promise<Material> {
    this.db.prepare(`
      UPDATE materials SET spec = ?, info = ?, sheet_size = ?, loss_rate = ?, unit = ?, color = ?, material_width = ?, updated_at = ?
      WHERE id = ?
    `).run(material.spec, material.info, material.sheetSize, material.lossRate, material.unit,
      material.color, material.materialWidth, new Date().toISOString(), material.id);
    return material;
  }

  private toEntity(r: any): Material {
    return {
      id: r.id,
      spec: r.spec,
      info: r.info,
      sheetSize: r.sheet_size,
      lossRate: r.loss_rate,
      unit: r.unit,
      color: r.color || '',
      materialWidth: r.material_width || 0,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }
}

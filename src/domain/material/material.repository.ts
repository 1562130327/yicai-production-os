// ============================================================
// 溢彩 Production OS — 材料仓储接口
// ============================================================

import { Material } from './material.entity';

export interface MaterialRepository {
  /** 按规格查找 */
  findBySpec(spec: string): Promise<Material | null>;

  /** 按ID查找 */
  findById(id: string): Promise<Material | null>;

  /** 查找所有 */
  findAll(): Promise<Material[]>;

  /** 搜索规格 */
  searchSpec(keyword: string): Promise<Material[]>;

  /** 创建材料 */
  create(material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>): Promise<Material>;

  /** 更新损耗率 */
  updateLossRate(id: string, lossRate: number): Promise<Material>;

  /** 保存 */
  save(material: Material): Promise<Material>;
}

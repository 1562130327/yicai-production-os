import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { MaterialMatchSchema, DeductInventorySchema, CreateInventorySchema } from '../../dto';
import { MaterialService } from '../../../application/material';
import { MaterialRepository } from '../../../domain/material';
import { InventoryRepository } from '../../../domain/inventory';
import { requireRole } from '../middleware/auth';

export function createMaterialRoutes(materialService: MaterialService, inventoryRepo: InventoryRepository, materialRepo: MaterialRepository): Router {
  const router = Router();

  /** GET /api/materials/options — 库存选项列表（下拉框用） */
  router.get('/options', asyncHandler(async (_req: Request, res: Response) => {
    const batches = await inventoryRepo.findAvailable('', 0);
    res.json({ success: true, data: { options: batches.map(b => ({
      id: b.id,
      label: `${b.supplierName}-${b.materialSpec}-${b.color||'default'}-${b.batchWidth||b.info}m-${b.info||''} (库存:${b.remainingQty}床)`,
      supplier: b.supplierName,
      material: b.materialSpec,
      color: b.color,
      width: b.batchWidth,
      stock: b.remainingQty,
    })) } });
  }));

  /** GET /api/materials/:spec/available — 查询库存可用量 */
  router.get('/:spec/available', asyncHandler(async (req: Request, res: Response) => {
    const result = await materialService.getAvailable(req.params.spec);
    if (result.isFailure()) { res.status(400).json({ success: false, error: result.error }); return; }
    res.json({ success: true, data: { spec: req.params.spec, available: result.value } });
  }));

  /** POST /api/materials/deduct — 扣减库存 */
  router.post('/deduct', requireRole('admin', 'merchandiser'), asyncHandler(async (req: Request, res: Response) => {
    const dto = DeductInventorySchema.parse(req.body);
    const result = await materialService.deductForOrder(dto.batchId, dto.quantity, dto.orderId);
    if (result.isFailure()) { res.status(400).json({ success: false, error: result.error }); return; }
    res.json({ success: true, data: null });
  }));

  /** POST /api/materials/inbound — 入库（仅管理员，自动创建材料+批次） */
  router.post('/inbound', requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
    const dto = CreateInventorySchema.parse(req.body);
    const spec = `${dto.width}m×${dto.length}m×${dto.thickness}mm`;
    const materialSpec = `${dto.supplier} — ${dto.material} — ${dto.color || '无颜色'} — ${dto.width}m宽 — ${dto.thickness}mm`;

    // 确保材料定义存在
    let material = await materialRepo.findBySpec(materialSpec);
    if (!material) {
      material = await materialRepo.create({
        spec: materialSpec,
        info: `${dto.material} ${spec}`,
        sheetSize: spec,
        lossRate: 0.05,
        unit: '床',
        color: dto.color,
        materialWidth: dto.width,
      } as any);
    }

    // 匹配或创建库存批次
    const existingBatches = await inventoryRepo.findByMaterialSpec(materialSpec);
    const matchingBatch = existingBatches.find(b => b.info === spec && b.batchWidth === dto.width);

    if (matchingBatch) {
      await inventoryRepo.inbound(matchingBatch.id, dto.quantity, dto.notes || '入库');
    } else {
      await inventoryRepo.create({
        batchNo: `${dto.supplier}-${dto.material}-${spec}`,
        materialSpec,
        info: spec,
        supplierName: dto.supplier,
        supplierInfo: dto.notes || '',
        remainingQty: dto.quantity,
        unit: '床',
        inboundWeek: dto.quantity,
        lastInboundAt: new Date().toISOString(),
        color: dto.color,
        batchWidth: dto.width,
        price: dto.price ?? 0,
      } as any);
    }

    res.status(201).json({ success: true, data: { message: `入库 ${dto.quantity} 床` } });
  }));

  return router;
}

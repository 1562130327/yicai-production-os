import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { OrderService } from '../../../application/order';
import { InventoryRepository } from '../../../domain/inventory';

export function createReportRoutes(orderService: OrderService, inventoryRepo: InventoryRepository): Router {
  const router = Router();

  router.get('/daily', asyncHandler(async (_req: Request, res: Response) => {
    const ordersResult = await orderService.getActiveOrders();
    const orders = ordersResult.isSuccess() ? ordersResult.value : [];
    const today = new Date().toISOString().split('T')[0];
    res.json({
      success: true,
      data: {
        date: today,
        newOrders: orders.filter(o => o.createdAt.startsWith(today)).length,
        inProgress: orders.filter(o => o.status === 'in_progress').length,
        totalActive: orders.length,
        completedToday: orders.filter(o => o.status === 'completed' && o.updatedAt.startsWith(today)).length,
      },
    });
  }));

  router.get('/inventory', asyncHandler(async (_req: Request, res: Response) => {
    const batches = await inventoryRepo.findByMaterialSpec('');
    const totalStock = batches.reduce((s, b) => s + b.remainingQty, 0);
    const lowStock = batches.filter(b => b.remainingQty > 0 && b.remainingQty < 10);
    const grouped: Record<string, any> = {};
    for (const b of batches) {
      if (!grouped[b.materialSpec]) grouped[b.materialSpec] = { totalQty: 0, batches: [] };
      grouped[b.materialSpec].totalQty += b.remainingQty;
      grouped[b.materialSpec].batches.push({ batchNo: b.batchNo, spec: b.info, qty: b.remainingQty });
    }
    res.json({ success: true, data: { totalStock, lowStockCount: lowStock.length, lowStockItems: lowStock.map(b => ({ supplier: b.supplierName, material: b.materialSpec, spec: b.info, qty: b.remainingQty })), byMaterial: grouped } });
  }));

  /** GET /api/reports/daily-inventory — 日报库存 */
  router.get('/daily-inventory', asyncHandler(async (_req: Request, res: Response) => {
    const today = new Date().toISOString().split('T')[0];
    const batches = await inventoryRepo.findByMaterialSpec('');
    const totalStock = batches.reduce((s: number, b: any) => s + b.remainingQty, 0);
    const allTxs = (await Promise.all(batches.map(b => inventoryRepo.getTransactions(b.id)))).flat();
    const todayTx = allTxs.filter((tx: any) => tx.timestamp.startsWith(today));

    res.json({ success: true, data: {
      date: today, totalStock,
      inboundToday: todayTx.filter((tx: any) => tx.type === 'inbound').reduce((s: number, tx: any) => s + tx.quantity, 0),
      outboundToday: todayTx.filter((tx: any) => tx.type === 'outbound').reduce((s: number, tx: any) => s + tx.quantity, 0),
      transactions: todayTx.slice(0, 50),
    }});
  }));

  /** GET /api/reports/weekly-inventory — 周报库存 */
  router.get('/weekly-inventory', asyncHandler(async (_req: Request, res: Response) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7*24*60*60*1000).toISOString();
    const batches = await inventoryRepo.findByMaterialSpec('');
    const groupBySupplier: Record<string, { inbound: number; outbound: number }> = {};
    for (const b of batches) {
      const txs = await inventoryRepo.getTransactions(b.id);
      for (const tx of txs) {
        if (tx.timestamp < weekAgo) continue;
        const key = b.supplierName || 'unknown';
        if (!groupBySupplier[key]) groupBySupplier[key] = { inbound: 0, outbound: 0 };
        if (tx.type === 'inbound') groupBySupplier[key].inbound += tx.quantity;
        else if (tx.type === 'outbound') groupBySupplier[key].outbound += tx.quantity;
      }
    }
    res.json({ success: true, data: {
      period: `${weekAgo.split('T')[0]} ~ ${now.toISOString().split('T')[0]}`,
      totalStock: batches.reduce((s: number, b: any) => s + b.remainingQty, 0),
      lowStock: batches.filter((b: any) => b.remainingQty > 0 && b.remainingQty < 10).length,
      bySupplier: groupBySupplier,
    }});
  }));

  /** GET /api/reports/monthly-orders — 月报订单 */
  router.get('/monthly-orders', asyncHandler(async (_req: Request, res: Response) => {
    const ordersResult = await orderService.getActiveOrders();
    const orders = ordersResult.isSuccess() ? ordersResult.value : [];
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30*24*60*60*1000).toISOString();
    const thisMonth = orders.filter((o: any) => o.createdAt >= monthAgo);
    const byCustomer: Record<string, number> = {};
    for (const o of thisMonth) {
      byCustomer[o.customerName] = (byCustomer[o.customerName] || 0) + 1;
    }
    res.json({ success: true, data: {
      period: `${monthAgo.split('T')[0]} ~ ${now.toISOString().split('T')[0]}`,
      total: orders.length,
      newThisMonth: thisMonth.filter((o: any) => o.status === 'pending').length,
      completedThisMonth: thisMonth.filter((o: any) => o.status === 'completed').length,
      byCustomer: Object.entries(byCustomer).sort((a: any, b: any) => b[1] - a[1]).slice(0, 20),
    }});
  }));

  return router;
}

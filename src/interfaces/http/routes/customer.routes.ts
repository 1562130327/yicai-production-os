import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { v4 as uuid } from 'uuid';

interface Customer { id: string; name: string; contact: string; phone: string; level: string; paymentCycle: string; address: string; notes: string; createdAt: string; updatedAt: string; }
const customers: Customer[] = [];

export function createCustomerRoutes(): Router {
  const router = Router();

  router.get('/', asyncHandler(async (_req: Request, res: Response) => {
    res.json({ success: true, data: customers });
  }));

  router.post('/', asyncHandler(async (req: Request, res: Response) => {
    const c: Customer = { id: uuid(), name: req.body.name || '', contact: req.body.contact || '', phone: req.body.phone || '', level: req.body.level || 'normal', paymentCycle: req.body.paymentCycle || '', address: req.body.address || '', notes: req.body.notes || '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    customers.push(c);
    res.status(201).json({ success: true, data: c });
  }));

  router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
    const idx = customers.findIndex(c => c.id === req.params.id);
    if (idx < 0) { res.status(404).json({ success: false, error: '客户不存在' }); return; }
    customers[idx] = { ...customers[idx], ...req.body, updatedAt: new Date().toISOString(), id: customers[idx].id };
    res.json({ success: true, data: customers[idx] });
  }));

  router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
    const idx = customers.findIndex(c => c.id === req.params.id);
    if (idx < 0) { res.status(404).json({ success: false, error: '客户不存在' }); return; }
    customers.splice(idx, 1);
    res.json({ success: true, data: null });
  }));

  return router;
}

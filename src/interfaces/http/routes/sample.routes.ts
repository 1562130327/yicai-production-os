import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { v4 as uuid } from 'uuid';

export function createSampleRoutes(): Router {
  const router = Router();
  const samples: any[] = [];

  router.get('/', asyncHandler(async (_req: Request, res: Response) => {
    res.json({ success: true, data: samples });
  }));

  router.post('/', asyncHandler(async (req: Request, res: Response) => {
    const { name, description, workers, createdBy } = req.body;
    const sample = { id: uuid(), name, description, workers: workers || [], status: 'pending', createdBy, createdAt: new Date().toISOString() };
    samples.push(sample);
    res.status(201).json({ success: true, data: sample });
  }));

  router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
    const sample = samples.find(s => s.id === req.params.id);
    if (!sample) { res.status(404).json({ success: false, error: '样板不存在' }); return; }
    Object.assign(sample, req.body, { updatedAt: new Date().toISOString() });
    res.json({ success: true, data: sample });
  }));

  return router;
}

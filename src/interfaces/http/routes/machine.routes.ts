import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { MachineRepository } from '../../../domain/machine';

export function createMachineRoutes(repo: MachineRepository): Router {
  const router = Router();
  router.get('/', asyncHandler(async (_req: Request, res: Response) => {
    res.json({ success: true, data: await repo.findAll() });
  }));
  router.put('/:id/status', asyncHandler(async (req: Request, res: Response) => {
    const m = await repo.updateStatus(req.params.id, req.body.status);
    res.json({ success: true, data: m });
  }));
  return router;
}

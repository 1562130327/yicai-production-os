import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { WorkerRepository } from '../../../domain/worker';

export function createWorkersAdminRoutes(repo: WorkerRepository): Router {
  const router = Router();
  router.get('/', asyncHandler(async (_req: Request, res: Response) => {
    res.json({ success: true, data: await repo.findAll() });
  }));
  return router;
}

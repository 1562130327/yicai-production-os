import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { getDashboardData } from '../../../modules/dashboard';
import { Services } from '../../../modules/production';

export function createDashboardRoutes(services: Services): Router {
  const router = Router();

  router.get('/', asyncHandler(async (_req: Request, res: Response) => {
    const data = await getDashboardData(services);
    res.json({ success: true, data });
  }));

  return router;
}

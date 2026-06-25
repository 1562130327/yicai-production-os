import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { listUsers, createUser, updateUser, resetPassword } from '../middleware/auth';

export function createUserRoutes(): Router {
  const router = Router();

  router.get('/', asyncHandler(async (_req: Request, res: Response) => {
    const users = await listUsers();
    res.json({ success: true, data: users });
  }));

  router.post('/', asyncHandler(async (req: Request, res: Response) => {
    const { username, password, name, role } = req.body;
    if (!username || !password || !name || !role) {
      res.status(400).json({ success: false, error: '缺少必填字段' });
      return;
    }
    if (!['admin', 'merchandiser', 'worker'].includes(role)) {
      res.status(400).json({ success: false, error: '无效角色' });
      return;
    }
    try {
      const user = await createUser({ username, password, name, role });
      res.json({ success: true, data: user });
    } catch (e: any) {
      if (e?.message?.includes('UNIQUE')) {
        res.status(409).json({ success: false, error: '用户名已存在' });
        return;
      }
      throw e;
    }
  }));

  router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { name, role, enabled } = req.body;
    if (role && !['admin', 'merchandiser', 'worker'].includes(role)) {
      res.status(400).json({ success: false, error: '无效角色' });
      return;
    }
    await updateUser(req.params.id, { name, role, enabled });
    res.json({ success: true, data: null });
  }));

  router.post('/:id/reset-password', asyncHandler(async (req: Request, res: Response) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      res.status(400).json({ success: false, error: '密码至少4位' });
      return;
    }
    await resetPassword(req.params.id, newPassword);
    res.json({ success: true, data: null });
  }));

  return router;
}

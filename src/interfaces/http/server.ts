// ============================================================
// 溢彩 Production OS — HTTP 服务器
// ============================================================

import express, { Express, Request, Response } from 'express';
import path from 'path';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/logger';
import { authMiddleware, login, logout, changePassword } from './middleware/auth';
import { registerRoutes } from './routes';

export async function createServer(): Promise<Express> {
  const app = express();

  // 基础中间件
  app.use(express.json());
  app.use(requestLogger);

  // 前端静态文件（Vue 3 构建产物）
  const clientDir = path.resolve(__dirname, '../../../client/dist');
  app.use(express.static(clientDir, { etag: false, cacheControl: false }));
  app.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

  // 认证路由（不受权限控制）
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ success: false, error: '请输入用户名和密码' });
      return;
    }
    const result = login(username, password);
    if (!result) {
      res.status(401).json({ success: false, error: '用户名或密码错误' });
      return;
    }
    res.json({ success: true, data: { token: result.token, user: result.user } });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) logout(auth.slice(7));
    res.json({ success: true, data: null });
  });

  app.post('/api/auth/changepwd', (req: Request, res: Response) => {
    const { username, oldPassword, newPassword } = req.body;
    if (changePassword(username, oldPassword, newPassword)) {
      res.json({ success: true, data: null });
    } else {
      res.status(400).json({ success: false, error: '原密码错误' });
    }
  });

  // 全局认证
  app.use(authMiddleware);

  // 业务路由
  await registerRoutes(app);

  // 健康检查
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 错误处理
  app.use(errorHandler);

  // SPA fallback：所有非 API 路由返回 index.html（必须放在最后）
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDir, 'index.html'));
  });

  return app;
}

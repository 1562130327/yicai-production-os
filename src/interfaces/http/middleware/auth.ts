// ============================================================
// 溢彩 Production OS — 认证与权限中间件
// ============================================================

import { Request, Response, NextFunction } from 'express';

// ---- 用户定义 ----
export type Role = 'admin' | 'merchandiser' | 'worker';

export interface User {
  username: string;
  password: string;
  name: string;
  role: Role;
}

function envPass(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

/** 内置用户，密码从环境变量读取（默认值仅用于本地开发） */
export const USERS: User[] = [
  { username: 'panguanglong', password: envPass('PWD_PGL', '123456'), name: '潘光龙', role: 'admin' },
  { username: 'panchaosen',  password: envPass('PWD_PCS', '123456'), name: '潘朝森', role: 'admin' },
  { username: 'luoqiaofang', password: envPass('PWD_LQF', '123456'), name: '罗巧芳', role: 'merchandiser' },
  { username: 'zengxiaofang',password: envPass('PWD_ZXF', '123456'), name: '曾小芳', role: 'merchandiser' },
  { username: 'penghongyuan',password: envPass('PWD_PHY', '123456'), name: '彭鸿媛', role: 'merchandiser' },
  { username: 'zhengsiyuan', password: envPass('PWD_ZSY', '123456'), name: '郑思远', role: 'worker' },
  { username: 'wuqianjin',   password: envPass('PWD_WQJ', '123456'), name: '伍乾进', role: 'worker' },
  { username: 'moqiguo',    password: envPass('PWD_MQG', '123456'), name: '莫齐国', role: 'worker' },
  { username: 'lile',       password: envPass('PWD_LL',  '123456'), name: '李乐',   role: 'worker' },
];

// ---- Session ----
const sessions = new Map<string, User>();

/** 简易登录 */
export function login(username: string, password: string): { token: string; user: User } | null {
  const user = USERS.find(u => u.username === username && u.password === password);
  if (!user) return null;
  const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
  sessions.set(token, user);
  return { token, user: { ...user, password: '' } };
}

/** 登出 */
export function logout(token: string): void {
  sessions.delete(token);
}

/** 修改密码 */
export function changePassword(username: string, oldPwd: string, newPwd: string): boolean {
  const user = USERS.find(u => u.username === username && u.password === oldPwd);
  if (!user) return false;
  user.password = newPwd;
  return true;
}

/** 认证中间件 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // 跳过登录、健康检查、静态文件
  if (req.path === '/api/auth/login' || req.path === '/health' || req.path === '/api/auth/logout') {
    next();
    return;
  }
  // 静态资源不拦截
  if (!req.path.startsWith('/api/')) {
    next();
    return;
  }

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未登录' });
    return;
  }

  const token = auth.slice(7);
  const user = sessions.get(token);
  if (!user) {
    res.status(401).json({ success: false, error: '登录已过期' });
    return;
  }

  (req as any).user = user;
  next();
}

/** 角色权限中间件 */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as User | undefined;
    if (!user) {
      res.status(401).json({ success: false, error: '未登录' });
      return;
    }
    if (!roles.includes(user.role)) {
      res.status(403).json({ success: false, error: '权限不足' });
      return;
    }
    next();
  };
}

/** 师傅只能操作自己的工序 */
export function workerOwnStep(req: Request, _res: Response, next: NextFunction) {
  const user = (req as any).user as User | undefined;
  if (user?.role === 'worker') {
    const worker = req.body?.worker;
    if (worker && worker !== user.name) {
      // 不允许冒名
      req.body.worker = user.name;
    }
  }
  next();
}

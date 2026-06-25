// ============================================================
// 溢彩 Production OS — 认证与权限中间件（数据库版）
// ============================================================

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { getConnection, Database } from '../../../infrastructure/database/connection';

export type Role = 'admin' | 'merchandiser' | 'worker';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  enabled: number;
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function uuid(): string {
  return crypto.randomUUID();
}

// ---- Session ----
const sessions = new Map<string, User>();

// ---- Seed ----
const SEED_USERS = [
  { username: 'panguanglong', name: '潘光龙', role: 'admin' },
  { username: 'panchaosen', name: '潘朝森', role: 'admin' },
  { username: 'luoqiaofang', name: '罗巧芳', role: 'merchandiser' },
  { username: 'zengxiaofang', name: '曾小芳', role: 'merchandiser' },
  { username: 'penghongyuan', name: '彭鸿媛', role: 'merchandiser' },
  { username: 'zhengsiyuan', name: '郑思远', role: 'worker' },
  { username: 'wuqianjin', name: '伍乾进', role: 'worker' },
  { username: 'moqiguo', name: '莫齐国', role: 'worker' },
  { username: 'lile', name: '李乐', role: 'worker' },
];

export async function seedUsers(db: Database): Promise<void> {
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as any;
  if (existing?.cnt > 0) return;
  const defaultHash = hashPassword('123456');
  const stmt = db.prepare('INSERT INTO users (id, username, password_hash, name, role, enabled) VALUES (?, ?, ?, ?, ?, 1)');
  for (const u of SEED_USERS) {
    stmt.run(uuid(), u.username, defaultHash, u.name, u.role);
  }
  stmt.free();
}

// ---- Auth functions ----
export async function login(username: string, password: string): Promise<{ token: string; user: User } | null> {
  const db = await getConnection();
  const hash = hashPassword(password);
  const row = db.prepare('SELECT id, username, name, role, enabled FROM users WHERE username = ? AND password_hash = ?').get(username, hash) as any;
  if (!row || !row.enabled) return null;
  const user: User = { id: row.id, username: row.username, name: row.name, role: row.role, enabled: row.enabled };
  const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
  sessions.set(token, user);
  return { token, user };
}

export function logout(token: string): void {
  sessions.delete(token);
}

export async function changePassword(username: string, oldPwd: string, newPwd: string): Promise<boolean> {
  const db = await getConnection();
  const oldHash = hashPassword(oldPwd);
  const row = db.prepare('SELECT id FROM users WHERE username = ? AND password_hash = ?').get(username, oldHash) as any;
  if (!row) return false;
  db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?').run(hashPassword(newPwd), row.id);
  return true;
}

// ---- CRUD ----
export async function listUsers(): Promise<Omit<User, never>[]> {
  const db = await getConnection();
  return db.prepare('SELECT id, username, name, role, enabled FROM users ORDER BY role, name').all() as any[];
}

export async function createUser(data: { username: string; password: string; name: string; role: string }): Promise<User> {
  const db = await getConnection();
  const id = uuid();
  const hash = hashPassword(data.password);
  db.prepare('INSERT INTO users (id, username, password_hash, name, role, enabled) VALUES (?, ?, ?, ?, ?, 1)').run(id, data.username, hash, data.name, data.role);
  return { id, username: data.username, name: data.name, role: data.role as Role, enabled: 1 };
}

export async function updateUser(id: string, data: { name?: string; role?: string; enabled?: number }): Promise<boolean> {
  const db = await getConnection();
  const fields: string[] = [];
  const values: any[] = [];
  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.role !== undefined) { fields.push('role = ?'); values.push(data.role); }
  if (data.enabled !== undefined) { fields.push('enabled = ?'); values.push(data.enabled); }
  if (fields.length === 0) return false;
  fields.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return true;
}

export async function resetPassword(id: string, newPassword: string): Promise<boolean> {
  const db = await getConnection();
  const hash = hashPassword(newPassword);
  const result = db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(hash, id);
  return true;
}

export async function findUserById(id: string): Promise<User | null> {
  const db = await getConnection();
  const row = db.prepare('SELECT id, username, name, role, enabled FROM users WHERE id = ?').get(id) as any;
  return row || null;
}

// ---- Middleware ----
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.path === '/api/auth/login' || req.path === '/health' || req.path === '/api/auth/logout') {
    next();
    return;
  }
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

export function workerOwnStep(req: Request, _res: Response, next: NextFunction) {
  const user = (req as any).user as User | undefined;
  if (user?.role === 'worker') {
    const worker = req.body?.worker;
    if (worker && worker !== user.name) {
      req.body.worker = user.name;
    }
  }
  next();
}

// ============================================================
// 溢彩 Production OS — 全局错误处理中间件
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { DomainError } from '../../../shared/errors';
import { ZodError } from 'zod';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // 领域异常
  if (err instanceof DomainError) {
    res.status(400).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // 参数校验异常
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '参数校验失败',
        details: err.errors,
      },
    });
    return;
  }

  // 未知异常
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '服务器内部错误',
    },
  });
}

/** 包装异步 handler，自动捕获异常 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

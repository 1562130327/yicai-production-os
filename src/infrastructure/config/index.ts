// ============================================================
// 溢彩 Production OS — 应用配置
// ============================================================

import path from 'path';

export interface AppConfig {
  port: number;
  databasePath: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  materialDefaultLossRate: number;
  maxSliceBatch: number;
}

export function loadConfig(): AppConfig {
  return {
    port: parseInt(process.env.PORT ?? '3000', 10),
    databasePath: process.env.DATABASE_PATH ?? path.resolve(__dirname, '../../../data/production.db'),
    logLevel: (process.env.LOG_LEVEL as AppConfig['logLevel']) ?? 'info',
    materialDefaultLossRate: parseFloat(process.env.MATERIAL_DEFAULT_LOSS_RATE ?? '0.05'),
    maxSliceBatch: parseInt(process.env.MAX_SLICE_BATCH ?? '100', 10),
  };
}

// ============================================================
// 溢彩 Production OS — 应用入口
// ============================================================

import 'dotenv/config';
import { createServer } from './interfaces/http/server';
import { loadConfig } from './infrastructure/config';
import { getConnection, closeConnection } from './infrastructure/database/connection';

async function main(): Promise<void> {
  console.log('🏭 溢彩 Production OS 启动中...');

  const config = loadConfig();

  // 初始化数据库连接（异步加载 WASM）
  await getConnection(config.databasePath);
  console.log(`📦 数据库已连接: ${config.databasePath}`);

  // 创建 HTTP 服务
  const app = await createServer();

  app.listen(config.port, () => {
    console.log(`🚀 服务已启动: http://localhost:${config.port}`);
    console.log(`  健康检查: http://localhost:${config.port}/health`);
    console.log(`  API 前缀: http://localhost:${config.port}/api`);
  });

  // 优雅关闭
  const shutdown = () => {
    console.log('\n🛑 正在关闭服务...');
    closeConnection();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('❌ 启动失败:', err);
  process.exit(1);
});

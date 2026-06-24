// 溢彩 Production OS — 工艺模板种子：将代码常量导入数据库

import { initSql, getConnection, saveToDisk, closeConnection } from '../infrastructure/database/connection';
import { PROCESS_TEMPLATE_MAP } from '../shared/types';

async function main() {
  console.log('Seeding process templates...');
  await initSql();
  const db = await getConnection();

  const existing = db.prepare('SELECT COUNT(*) as cnt FROM process_templates').get() as any;
  if (existing.cnt > 0) {
    console.log(`  ⏭️  ${existing.cnt} templates already exist`);
    closeConnection();
    return;
  }

  const stmt = db.prepare('INSERT INTO process_templates (id, name, steps) VALUES (?, ?, ?)');
  let count = 0;
  for (const [name, steps] of Object.entries(PROCESS_TEMPLATE_MAP)) {
    const id = 'tpl-' + name;
    stmt.run(id, name, JSON.stringify(steps));
    count++;
  }
  console.log(`  ✅ ${count} templates seeded`);

  saveToDisk();
  closeConnection();
}

main().catch(err => { console.error(err); process.exit(1); });

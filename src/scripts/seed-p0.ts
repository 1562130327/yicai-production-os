// 溢彩 Production OS — P0 种子数据：机器 + 工人

import { initSql, getConnection, saveToDisk, closeConnection } from '../infrastructure/database/connection';
import { SqliteMachineRepository } from '../infrastructure/database/repositories/machine.repo';
import { SqliteWorkerRepository } from '../infrastructure/database/repositories/worker.repo';
import { ProcessType } from '../shared/types';

async function main() {
  console.log('Seeding P0 data...');
  await initSql();
  const db = await getConnection();
  const machineRepo = new SqliteMachineRepository(db);
  const workerRepo = new SqliteWorkerRepository(db);

  // 14台机器
  const machines: Array<{code:string;name:string;type:string;status:'idle';processTypes:ProcessType[];workshop:string}> = [
    { code: 'M01', name: '横竖分切机', type: '切割', status: 'idle', processTypes: ['横竖分切'], workshop: '一车间' },
    { code: 'M02', name: '破片机', type: '切割', status: 'idle', processTypes: ['破片'], workshop: '一车间' },
    { code: 'M03', name: '直切机', type: '切割', status: 'idle', processTypes: ['直切'], workshop: '一车间' },
    { code: 'M04', name: '新自动冲床', type: '冲床', status: 'idle', processTypes: ['冲型'], workshop: '一车间' },
    { code: 'M05', name: '旧自动冲床', type: '冲床', status: 'idle', processTypes: ['冲型'], workshop: '一车间' },
    { code: 'M06', name: '100T冲床A面', type: '冲床', status: 'idle', processTypes: ['冲型'], workshop: '一车间' },
    { code: 'M07', name: '100T冲床B面', type: '冲床', status: 'idle', processTypes: ['冲型'], workshop: '一车间' },
    { code: 'M08', name: '热熔胶机', type: '胶机', status: 'idle', processTypes: ['背胶', '贴布', '粘胶'], workshop: '一车间' },
    { code: 'M09', name: '点胶机1', type: '胶机', status: 'idle', processTypes: ['点胶'], workshop: '一车间' },
    { code: 'M10', name: '点胶机2', type: '胶机', status: 'idle', processTypes: ['点胶'], workshop: '一车间' },
    { code: 'M11', name: '排废机1', type: '辅助', status: 'idle', processTypes: [] as ProcessType[], workshop: '一车间' },
    { code: 'M12', name: '排废机2', type: '辅助', status: 'idle', processTypes: [] as ProcessType[], workshop: '一车间' },
    { code: 'M13', name: '改回填机', type: '辅助', status: 'idle', processTypes: ['改回填'], workshop: '一车间' },
    { code: 'M14', name: '排废改回填机', type: '辅助', status: 'idle', processTypes: ['改回填'], workshop: '一车间' },
  ];

  const existingMachines = await machineRepo.findAll();
  if (existingMachines.length === 0) {
    for (const m of machines) {
      await machineRepo.create(m);
    }
    console.log(`  ✅ ${machines.length} machines created`);
  } else {
    console.log(`  ⏭️  ${existingMachines.length} machines already exist`);
  }

  // 7名工人
  const workers = [
    { name: '郑思远', role: '横竖分切', skills: ['横竖分切', '分切', '改回填'], status: 'active' as const, phone: '' },
    { name: '伍乾进', role: '破片', skills: ['破片', '开片'], status: 'active' as const, phone: '' },
    { name: '莫齐国', role: '直切', skills: ['直切', '精准切片'], status: 'active' as const, phone: '' },
    { name: '李乐', role: '冲型', skills: ['冲型', '冲床操作'], status: 'active' as const, phone: '' },
    { name: '周忠琼', role: '冲床辅助', skills: ['冲型', '辅助'], status: 'active' as const, phone: '' },
    { name: '简翠花', role: '背胶/点胶', skills: ['背胶', '点胶', '贴布'], status: 'active' as const, phone: '' },
    { name: '杨合进', role: '打包', skills: ['打包'], status: 'active' as const, phone: '' },
  ];

  const existingWorkers = await workerRepo.findAll();
  if (existingWorkers.length === 0) {
    for (const w of workers) {
      await workerRepo.create(w);
    }
    console.log(`  ✅ ${workers.length} workers created`);
  } else {
    console.log(`  ⏭️  ${existingWorkers.length} workers already exist`);
  }

  saveToDisk();
  closeConnection();
  console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });

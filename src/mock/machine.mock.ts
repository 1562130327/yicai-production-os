import { Machine } from '../domain/machine';

export const MACHINE_MOCK: Machine[] = [
  { id: 'M1', code: 'HSCQ-01', name: '横竖分切机1号', type: 'cutting', status: 'idle', processTypes: ['横竖分切'], workshop: 'A车间', createdAt: '2026-01-01', updatedAt: '2026-06-23' },
  { id: 'M2', code: 'HSCQ-02', name: '横竖分切机2号', type: 'cutting', status: 'running', processTypes: ['横竖分切'], workshop: 'A车间', createdAt: '2026-01-01', updatedAt: '2026-06-23' },
  { id: 'M3', code: 'PPJ-01', name: '破片机1号', type: 'splitting', status: 'idle', processTypes: ['破片'], workshop: 'A车间', createdAt: '2026-01-01', updatedAt: '2026-06-23' },
  { id: 'M4', code: 'PPJ-02', name: '破片机2号', type: 'splitting', status: 'idle', processTypes: ['破片'], workshop: 'A车间', createdAt: '2026-01-01', updatedAt: '2026-06-23' },
  { id: 'M5', code: 'ZQJ-01', name: '直切机1号', type: 'cutting', status: 'running', processTypes: ['直切'], workshop: 'B车间', createdAt: '2026-01-01', updatedAt: '2026-06-23' },
  { id: 'M6', code: 'ZQJ-02', name: '直切机2号', type: 'cutting', status: 'idle', processTypes: ['直切'], workshop: 'B车间', createdAt: '2026-01-01', updatedAt: '2026-06-23' },
  { id: 'M7', code: 'CC-01', name: '冲床1号', type: 'punching', status: 'running', processTypes: ['冲型'], workshop: 'B车间', createdAt: '2026-01-01', updatedAt: '2026-06-23' },
  { id: 'M8', code: 'CC-02', name: '冲床2号', type: 'punching', status: 'idle', processTypes: ['冲型'], workshop: 'B车间', createdAt: '2026-01-01', updatedAt: '2026-06-23' },
  { id: 'M9', code: 'RHJ-01', name: '热熔胶机1号', type: 'gluing', status: 'idle', processTypes: ['背胶', '贴布', '粘胶'], workshop: 'C车间', createdAt: '2026-01-01', updatedAt: '2026-06-23' },
  { id: 'M10', code: 'RHJ-02', name: '热熔胶机2号', type: 'gluing', status: 'maintenance', processTypes: ['背胶', '贴布', '粘胶'], workshop: 'C车间', createdAt: '2026-01-01', updatedAt: '2026-06-23' },
  { id: 'M11', code: 'DJJ-01', name: '点胶机1号', type: 'gluing', status: 'idle', processTypes: ['点胶'], workshop: 'C车间', createdAt: '2026-01-01', updatedAt: '2026-06-23' },
  { id: 'M12', code: 'GHT-01', name: '改回填机1号', type: 'processing', status: 'idle', processTypes: ['改回填'], workshop: 'D车间', createdAt: '2026-01-01', updatedAt: '2026-06-23' },
  { id: 'M13', code: 'DBT-01', name: '打包台1号', type: 'packing', status: 'idle', processTypes: ['打包'], workshop: 'D车间', createdAt: '2026-01-01', updatedAt: '2026-06-23' },
  { id: 'M14', code: 'DBT-02', name: '打包台2号', type: 'packing', status: 'idle', processTypes: ['打包'], workshop: 'D车间', createdAt: '2026-01-01', updatedAt: '2026-06-23' },
];

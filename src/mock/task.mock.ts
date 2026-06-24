import { Task } from '../domain/task';

export const TASK_MOCK: Task[] = [
  { id: 'T1', orderId: 'ORD-001', processStepId: 'STEP-001', processType: '横竖分切', assignedWorker: '郑思远', machineId: 'M2', status: 'running', priority: 'deadline', estimatedHours: 2, quantity: 500, completedQty: 300, scheduledAt: '2026-06-23T08:00:00', startedAt: '2026-06-23T08:15:00', createdAt: '2026-06-20', updatedAt: '2026-06-23' },
  { id: 'T2', orderId: 'ORD-001', processStepId: 'STEP-002', processType: '破片', assignedWorker: '伍乾进', machineId: 'M3', status: 'queued', priority: 'deadline', estimatedHours: 1.5, quantity: 500, createdAt: '2026-06-20', updatedAt: '2026-06-20' },
  { id: 'T3', orderId: 'ORD-001', processStepId: 'STEP-003', processType: '直切', assignedWorker: '莫齐国', machineId: 'M5', status: 'running', priority: 'deadline', estimatedHours: 3, quantity: 500, completedQty: 200, scheduledAt: '2026-06-23T08:00:00', startedAt: '2026-06-23T09:00:00', createdAt: '2026-06-20', updatedAt: '2026-06-23' },
  { id: 'T4', orderId: 'ORD-002', processStepId: 'STEP-004', processType: '横竖分切', status: 'queued', priority: 'urgent', estimatedHours: 1.5, quantity: 300, createdAt: '2026-06-21', updatedAt: '2026-06-21' },
  { id: 'T5', orderId: 'ORD-005', processStepId: 'STEP-005', processType: '冲型', assignedWorker: '李乐', machineId: 'M7', status: 'running', priority: 'unmentioned', estimatedHours: 4, quantity: 800, completedQty: 400, scheduledAt: '2026-06-22T08:00:00', startedAt: '2026-06-22T08:30:00', createdAt: '2026-06-18', updatedAt: '2026-06-23' },
];

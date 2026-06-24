import { TraceEvent } from '../domain/trace';

export const TRACE_MOCK: TraceEvent[] = [
  { id: 'TR-001', orderId: 'ORD-001', eventType: 'order_created', metadata: { code: 'YC-2026-001', productCode: 'EVA-301' }, timestamp: '2026-06-20T10:00:00' },
  { id: 'TR-002', orderId: 'ORD-001', eventType: 'material_matched', processType: '横竖分切', metadata: { materialSpec: 'EVA白色1.2m', matchRate: 1.0 }, timestamp: '2026-06-20T10:01:00' },
  { id: 'TR-003', orderId: 'ORD-001', eventType: 'process_started', processType: '横竖分切', processStatus: 'running', metadata: { flowId: 'FLOW-001' }, timestamp: '2026-06-23T08:15:00' },
  { id: 'TR-004', orderId: 'ORD-001', eventType: 'task_assigned', worker: '郑思远', machineId: 'M2', metadata: { scheduledAt: '2026-06-23T08:00:00' }, timestamp: '2026-06-23T08:00:00' },
  { id: 'TR-005', orderId: 'ORD-001', eventType: 'task_completed', processType: '横竖分切', worker: '郑思远', metadata: { quantity: 200, completedQty: 200 }, timestamp: '2026-06-23T10:30:00' },
  { id: 'TR-006', orderId: 'ORD-001', eventType: 'task_completed', processType: '横竖分切', worker: '郑思远', metadata: { quantity: 100, completedQty: 300 }, timestamp: '2026-06-23T14:00:00' },
  { id: 'TR-007', orderId: 'ORD-004', eventType: 'order_completed', metadata: { completedAt: '2026-06-20T16:00:00' }, timestamp: '2026-06-20T16:00:00' },
];

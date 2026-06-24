import { ProcessFlow, ProcessStep } from '../domain/process';

export const PROCESS_FLOW_MOCK: ProcessFlow[] = [
  {
    id: 'FLOW-001',
    orderId: 'ORD-001',
    steps: [
      { id: 'STEP-001', type: '横竖分切', name: '横竖分切', sequence: 1, status: 'running', requiredQty: undefined, completedQty: 300, sliceSize: '300x400', sliceQty: 500 },
      { id: 'STEP-002', type: '破片', name: '破片', sequence: 2, status: 'waiting', requiredQty: undefined, completedQty: 0 },
      { id: 'STEP-003', type: '直切', name: '直切', sequence: 3, status: 'waiting', requiredQty: 500, completedQty: 0, sliceSize: '300x400', sliceQty: 500 },
      { id: 'STEP-004', type: '冲型', name: '冲型', sequence: 4, status: 'waiting', requiredQty: 500, completedQty: 0, punchType: '单冲', punchQty: 500 },
    ],
    edges: [
      { from: 'STEP-001', to: 'STEP-002', condition: '横竖分切 → 破片' },
      { from: 'STEP-002', to: 'STEP-003', condition: '破片 → 直切' },
      { from: 'STEP-003', to: 'STEP-004', condition: '直切 → 冲型' },
    ],
  },
];

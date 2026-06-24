import { ProcessType } from '../../shared/types';

export interface Machine {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly type: string;
  readonly status: 'idle' | 'running' | 'maintenance';
  readonly processTypes: ProcessType[];
  readonly workshop: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

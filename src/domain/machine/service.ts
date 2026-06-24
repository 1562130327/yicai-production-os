import { Machine } from './machine.entity';
import { ProcessType } from '../process/types';

export class MachineDomainService {
  /** 检查机器是否可用 */
  isAvailable(machine: Machine): boolean {
    return machine.status === 'idle';
  }

  /** 检查机器是否能处理指定工序 */
  canProcessType(machine: Machine, processType: ProcessType): boolean {
    return machine.processTypes.includes(processType);
  }
}

import { Worker } from './worker.entity';

export class WorkerDomainService {
  /** 检查工人是否有指定技能 */
  hasSkill(worker: Worker, skill: string): boolean {
    return worker.skills.includes(skill);
  }

  /** 检查工人是否可用 */
  isAvailable(worker: Worker): boolean {
    return worker.status === 'active';
  }
}

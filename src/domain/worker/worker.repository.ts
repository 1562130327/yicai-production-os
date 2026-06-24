import { Worker } from './worker.entity';

export interface WorkerRepository {
  findById(id: string): Promise<Worker | null>;
  findAll(): Promise<Worker[]>;
  findByRole(role: string): Promise<Worker[]>;
  updateStatus(id: string, status: string): Promise<Worker>;
  create(worker: Omit<Worker, 'id' | 'createdAt' | 'updatedAt'>): Promise<Worker>;
}

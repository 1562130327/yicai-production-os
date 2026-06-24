import { Machine } from './machine.entity';

export interface MachineRepository {
  findById(id: string): Promise<Machine | null>;
  findAll(): Promise<Machine[]>;
  findByStatus(status: string): Promise<Machine[]>;
  updateStatus(id: string, status: string): Promise<Machine>;
  create(machine: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>): Promise<Machine>;
}

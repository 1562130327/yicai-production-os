export interface Worker {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly skills: string[];
  readonly status: 'active' | 'inactive';
  readonly phone: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

import request from './request'
import type { ApiResponse } from '@/types/api'

export interface WorkerTask {
  orderId: string
  orderCode: string
  customer: string
  spec: string
  machine: string
  priorityLabel: string
  priorityColor: string
  stepId: string
  stepType: string
  stepSequence: number
  stepStatus: string
  totalSteps: number
  flowId: string
  completedQty: number
  requiredQty: number
}

export interface WorkerTaskData {
  count: number
  running: number
  waiting: number
  tasks: WorkerTask[]
}

export interface WorkerInfo {
  name: string
  role: string
  skills: string[]
  status: string
  phone?: string
}

export interface MachineInfo {
  name: string
  type: string
  status: 'idle' | 'running' | 'maintenance'
  workshop?: string
  processTypes?: string[]
}

export const workersApi = {
  getTasks(workerName: string): Promise<ApiResponse<WorkerTaskData>> {
    return request.get(`/workers/${workerName}/tasks`)
  },
  listAll(): Promise<ApiResponse<WorkerInfo[]>> {
    return request.get('/workers-admin')
  },
  getMachines(): Promise<ApiResponse<MachineInfo[]>> {
    return request.get('/machines')
  },
}

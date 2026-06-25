import request from './request'
import type { ApiResponse } from '@/types/api'
import type { ProcessFlow } from '@/types/process'

export const processesApi = {
  getByOrder(orderId: string): Promise<ApiResponse<ProcessFlow>> {
    return request.get(`/processes/${orderId}`)
  },
  complete(
    flowId: string,
    stepId: string,
    quantity: number,
    worker: string,
  ): Promise<ApiResponse<{ message: string }>> {
    return request.post('/processes/complete', { flowId, stepId, quantity, worker })
  },
}

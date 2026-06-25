import request from './request'
import type { ApiResponse } from '@/types/api'

export interface FeedbackInput {
  orderId: string
  processStepId: string
  flowId: string
  type: string
  description: string
  severity: string
}

export const feedbackApi = {
  submit(data: FeedbackInput): Promise<ApiResponse<{ message: string }>> {
    return request.post('/feedback', data)
  },
}

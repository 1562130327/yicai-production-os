import request from './request'
import type { ApiResponse } from '@/types/api'
import type { MaterialOption, InventoryData, InboundInput } from '@/types/material'

export const materialsApi = {
  getOptions(): Promise<ApiResponse<{ options: MaterialOption[] }>> {
    return request.get('/materials/options')
  },
  inbound(data: InboundInput): Promise<ApiResponse<{ message: string }>> {
    return request.post('/materials/inbound', data)
  },
  getInventory(): Promise<ApiResponse<InventoryData>> {
    return request.get('/reports/inventory')
  },
}

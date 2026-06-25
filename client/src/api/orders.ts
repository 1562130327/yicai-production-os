import request from './request'
import type { ApiResponse } from '@/types/api'
import type { Order, OrderCreateInput } from '@/types/order'

export const ordersApi = {
  list(): Promise<ApiResponse<Order[]>> {
    return request.get('/orders')
  },
  create(data: OrderCreateInput): Promise<ApiResponse<Order>> {
    return request.post('/orders', data)
  },
  assign(orderId: string, workerName: string): Promise<ApiResponse<void>> {
    return request.put(`/orders/${orderId}/assign`, { workerName })
  },
}

import request from './request'
import type { ApiResponse } from '@/types/api'

export interface Customer {
  id: string
  name: string
}

export interface Sample {
  id: string
  name: string
  customerId: string
}

export const customersApi = {
  list(): Promise<ApiResponse<Customer[]>> {
    return request.get('/customers')
  },
  getSamples(): Promise<ApiResponse<Sample[]>> {
    return request.get('/samples')
  },
}

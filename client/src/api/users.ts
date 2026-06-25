import request from './request'
import type { ApiResponse } from '@/types/api'

export interface UserItem {
  id: string
  username: string
  name: string
  role: string
  enabled: number
}

export interface CreateUserInput {
  username: string
  password: string
  name: string
  role: string
}

export interface UpdateUserInput {
  name?: string
  role?: string
  enabled?: number
}

export const usersApi = {
  list(): Promise<ApiResponse<UserItem[]>> {
    return request.get('/users')
  },
  create(data: CreateUserInput): Promise<ApiResponse<UserItem>> {
    return request.post('/users', data)
  },
  update(id: string, data: UpdateUserInput): Promise<ApiResponse<null>> {
    return request.put(`/users/${id}`, data)
  },
  resetPassword(id: string, newPassword: string): Promise<ApiResponse<null>> {
    return request.post(`/users/${id}/reset-password`, { newPassword })
  },
}

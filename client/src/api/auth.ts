import request from './request'
import type { ApiResponse } from '@/types/api'
import type { LoginInput, LoginResult } from '@/types/user'

export const authApi = {
  login(data: LoginInput): Promise<ApiResponse<LoginResult>> {
    return request.post('/auth/login', data)
  },
  logout(): Promise<ApiResponse<null>> {
    return request.post('/auth/logout')
  },
  changePassword(
    username: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<ApiResponse<null>> {
    return request.post('/auth/changepwd', { username, oldPassword, newPassword })
  },
}

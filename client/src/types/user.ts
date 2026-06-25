export type UserRole = 'admin' | 'merchandiser' | 'worker'

export interface User {
  id: string
  username: string
  name: string
  role: UserRole
  phone?: string
  skills?: string[]
}

export interface LoginInput {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  user: User
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  error?: string | { message: string }
}

export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

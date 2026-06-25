import request from './request'
import type { ApiResponse } from '@/types/api'
import type { DailyReport, WeeklyReport, MonthlyReport } from '@/types/report'

export const reportsApi = {
  daily(): Promise<ApiResponse<DailyReport>> {
    return request.get('/reports/daily-inventory')
  },
  weekly(): Promise<ApiResponse<WeeklyReport>> {
    return request.get('/reports/weekly-inventory')
  },
  monthly(): Promise<ApiResponse<MonthlyReport>> {
    return request.get('/reports/monthly-orders')
  },
}

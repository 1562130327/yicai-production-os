export interface DailyReport {
  totalStock: number
  inboundToday: number
  outboundToday: number
  transactions: Transaction[]
}

export interface Transaction {
  batchId: string
  type: string
  quantity: number
  timestamp: string
}

export interface WeeklyReport {
  totalStock: number
  lowStock: number
  bySupplier: Record<string, { inbound: number; outbound: number }>
}

export interface MonthlyReport {
  total: number
  newThisMonth: number
  completedThisMonth: number
  byCustomer: [string, number][]
}

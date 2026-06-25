export type OrderStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type OrderPriority = 'unmentioned' | 'attention' | 'normal' | 'urgent' | 'deadline'

export interface Order {
  id: string
  code: string
  customerName: string
  productCode?: string
  processTemplate: string
  materialSpec: string
  sheetSize: string
  sliceSize: string
  sliceQty: number
  punchSize?: string
  punchQty?: number
  priority: OrderPriority
  status: OrderStatus
  category: string
  createdAt: string
  updatedAt: string
}

export interface OrderCreateInput {
  code: string
  customerName: string
  productCode?: string
  processTemplate: string
  priority: OrderPriority
  materialSpec: string
  sheetSize: string
  sliceSize: string
  sliceQty: number
  punchSize?: string
  punchQty?: number
  category: string
  dimensions?: DimensionRow[]
}

export interface DimensionRow {
  sliceSize?: string
  sliceQty?: number
  punchSize?: string
  punchQty?: number
}

export interface OrderListParams {
  search?: string
  status?: OrderStatus
}

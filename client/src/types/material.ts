export interface MaterialOption {
  id: string
  label: string
}

export interface MaterialBatch {
  batchNo: string
  spec: string
  qty: number
}

export interface MaterialGroup {
  totalQty: number
  batches: MaterialBatch[]
}

export interface InventoryData {
  totalStock: number
  lowStockCount: number
  byMaterial: Record<string, MaterialGroup>
}

export interface InboundInput {
  supplier: string
  material: string
  color: string
  width: number
  length: number
  thickness: number
  quantity: number
  price?: number
  notes?: string
}

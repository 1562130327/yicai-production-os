export type InventoryTransactionType = 'inbound' | 'outbound' | 'reserved' | 'released';

export interface DeductInventoryInput {
  batchId: string;
  quantity: number;
  orderId: string;
  reason: string;
}

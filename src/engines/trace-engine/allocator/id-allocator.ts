// ============================================================
// 溢彩 Production OS — ID 分配器
// 为追溯事件生成唯一标识
// ============================================================

import { v4 as uuid } from 'uuid';

/** 生成追溯事件ID */
export function generateEventId(): string {
  return uuid();
}

/** 生成补产订单ID */
export function generateSupplementOrderId(originalOrderId: string): string {
  return `SUP-${originalOrderId}-${Date.now()}`;
}

// ============================================================
// 溢彩 Production OS — 领域异常
// ============================================================

/** 领域异常基类 */
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class OrderNotFoundError extends DomainError {
  constructor(orderId: string) {
    super(`订单 ${orderId} 不存在`, 'ORDER_NOT_FOUND', { orderId });
  }
}

export class MaterialNotAvailableError extends DomainError {
  constructor(materialSpec: string, required: number, available: number) {
    super(
      `材料 ${materialSpec} 库存不足: 需要 ${required}, 可用 ${available}`,
      'MATERIAL_NOT_AVAILABLE',
      { materialSpec, required, available },
    );
  }
}

export class InvalidProcessFlowError extends DomainError {
  constructor(processType: string, fromStatus: string, toStatus: string) {
    super(
      `工序流转非法: ${processType} 不能从 ${fromStatus} 切换到 ${toStatus}`,
      'INVALID_PROCESS_FLOW',
      { processType, fromStatus, toStatus },
    );
  }
}

export class ScheduleConflictError extends DomainError {
  constructor(machineId: string, reason: string) {
    super(`调度冲突: 机器 ${machineId} — ${reason}`, 'SCHEDULE_CONFLICT', { machineId, reason });
  }
}

export class InventoryBatchNotFoundError extends DomainError {
  constructor(batchId: string) {
    super(`库存批次 ${batchId} 不存在`, 'INVENTORY_BATCH_NOT_FOUND', { batchId });
  }
}

export class TaskAssignmentError extends DomainError {
  constructor(taskId: string, reason: string) {
    super(`任务分配失败: ${taskId} — ${reason}`, 'TASK_ASSIGNMENT_FAILED', { taskId, reason });
  }
}

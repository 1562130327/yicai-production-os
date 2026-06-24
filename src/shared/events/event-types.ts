// ============================================================
// 溢彩 Production OS — 领域事件联合类型
// 所有 Domain 的强类型事件汇聚于此
// ============================================================

import { OrderCreatedEvent, OrderCompletedEvent, OrderStatusChangedEvent } from '../../domain/order/events';
import { ProcessStartedEvent, ProcessCompletedEvent, ProcessFailedEvent, ReworkTriggeredEvent } from '../../domain/process/events';
import { MaterialMatchedEvent, MaterialReservedEvent } from '../../domain/material/events';
import { InventoryDeductedEvent, InventoryInboundEvent, InventoryLowWarningEvent } from '../../domain/inventory/events';
import { TaskAssignedEvent, TaskCompletedEvent, TaskFailedEvent } from '../../domain/task/events';
import { AnomalyDetectedEvent, SupplementStartedEvent, SupplementNeededEvent } from '../../domain/trace/events';
import { MachineStatusChangedEvent } from '../../domain/machine/events';
import { WorkerAssignedEvent, WorkerReleasedEvent } from '../../domain/worker/events';
import { CustomerCreatedEvent } from '../../domain/customer/events';

/** 所有领域事件的联合类型 */
export type DomainEventUnion =
  | OrderCreatedEvent
  | OrderCompletedEvent
  | OrderStatusChangedEvent
  | ProcessStartedEvent
  | ProcessCompletedEvent
  | ProcessFailedEvent
  | ReworkTriggeredEvent
  | MaterialMatchedEvent
  | MaterialReservedEvent
  | InventoryDeductedEvent
  | InventoryInboundEvent
  | InventoryLowWarningEvent
  | TaskAssignedEvent
  | TaskCompletedEvent
  | TaskFailedEvent
  | AnomalyDetectedEvent
  | SupplementStartedEvent
  | SupplementNeededEvent
  | MachineStatusChangedEvent
  | WorkerAssignedEvent
  | WorkerReleasedEvent
  | CustomerCreatedEvent;

/** 事件类型 → 事件类的映射 */
export type DomainEventByType<T extends DomainEventUnion['type']> = Extract<DomainEventUnion, { type: T }>;

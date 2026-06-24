export type TraceEventType =
  | 'order_created' | 'material_matched' | 'process_started' | 'process_completed'
  | 'process_failed' | 'task_assigned' | 'task_completed' | 'rework_triggered'
  | 'supplement_started' | 'supplement_needed' | 'order_completed'
  | 'anomaly_detected' | 'stock_priority_skipped';

export type AnomalyType = 'defect' | 'shortage' | 'machine_failure' | 'human_error';
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

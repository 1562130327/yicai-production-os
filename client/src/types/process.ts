export type StepStatus = 'waiting' | 'ready' | 'running' | 'done' | 'rework'

export interface ProcessStep {
  id: string
  type: string
  status: StepStatus
  workerName?: string
  completedQty: number
  requiredQty: number
  sliceSize?: string
  punchQty?: number
  sequence: number
}

export interface ProcessFlow {
  id: string
  orderId: string
  steps: ProcessStep[]
  currentStepId?: string
}

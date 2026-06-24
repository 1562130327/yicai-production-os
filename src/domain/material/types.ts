export interface MaterialMatch {
  readonly materialId: string;
  readonly materialSpec: string;
  readonly requiredQty: number;
  readonly availableQty: number;
  readonly shortage: number;
  readonly matchRate: number;
  readonly suggestedBatches: string[];
}

export interface CuttingPlan {
  readonly materialSpec: string;
  readonly sheetSize: string;
  readonly sliceSize: string;
  readonly slicesPerSheet: number;
  readonly totalSheets: number;
  readonly totalSlices: number;
  readonly expectedLoss: number;
  readonly lossRate: number;
  readonly usedBatches: BatchUsage[];
}

export interface BatchUsage {
  readonly batchId: string;
  readonly quantity: number;
}

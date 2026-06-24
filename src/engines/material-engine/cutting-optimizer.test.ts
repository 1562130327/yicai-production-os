// ============================================================
// 溢彩 Production OS — 切割优化器测试
// ============================================================

import { describe, it, expect } from 'vitest';
import { parseSize, slicesPerSheet, generateCuttingPlan } from './cutting-optimizer';

describe('切割优化器', () => {
  describe('parseSize', () => {
    it('解析 "1200x2400"', () => {
      expect(parseSize('1200x2400')).toEqual({ width: 1200, height: 2400 });
    });

    it('解析带中文乘号的尺寸', () => {
      expect(parseSize('300×400')).toEqual({ width: 300, height: 400 });
    });
  });

  describe('slicesPerSheet', () => {
    it('1200x2400 片材切 300x400 切片', () => {
      const result = slicesPerSheet('1200x2400', '300x400');
      // 横向: 1200/300=4, 纵向: 2400/400=6 → 24
      // 旋转: 1200/400=3, 2400/300=8 → 24
      expect(result).toBe(24);
    });

    it('1000x1000 片材切 400x300 切片', () => {
      const result = slicesPerSheet('1000x1000', '400x300');
      expect(result).toBeGreaterThan(0);
    });

    it('切片大于片材时返回0', () => {
      const result = slicesPerSheet('100x100', '200x200');
      expect(result).toBe(0);
    });
  });

  describe('generateCuttingPlan', () => {
    it('库存充足时生成切割方案', () => {
      const plan = generateCuttingPlan({
        materialSpec: 'EVA-5mm',
        sheetSize: '1200x2400',
        sliceSize: '300x400',
        sliceQty: 100,
        lossRate: 0.05,
        availableBatches: [{ batchId: 'B001', quantity: 50 }],
      });

      expect(plan).not.toBeNull();
      if (plan) {
        expect(plan.materialSpec).toBe('EVA-5mm');
        expect(plan.totalSlices).toBeGreaterThanOrEqual(100);
        expect(plan.expectedLoss).toBeGreaterThanOrEqual(0);
      }
    });

    it('库存不足时返回 null', () => {
      const plan = generateCuttingPlan({
        materialSpec: 'EVA-5mm',
        sheetSize: '1200x2400',
        sliceSize: '300x400',
        sliceQty: 10000,
        lossRate: 0.05,
        availableBatches: [{ batchId: 'B001', quantity: 5 }],
      });

      expect(plan).toBeNull();
    });
  });
});

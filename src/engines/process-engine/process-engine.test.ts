// ============================================================
// 溢彩 Production OS — 工序引擎单元测试
// ============================================================

import { describe, it, expect } from 'vitest';
import { canTransition, getNextStates, isTerminal, isActive } from './rules/state-machine';

describe('工序状态机', () => {
  describe('canTransition', () => {
    it('waiting → ready 合法', () => {
      expect(canTransition('waiting', 'ready')).toBe(true);
    });

    it('ready → running 合法', () => {
      expect(canTransition('ready', 'running')).toBe(true);
    });

    it('running → done 合法', () => {
      expect(canTransition('running', 'done')).toBe(true);
    });

    it('running → paused 合法', () => {
      expect(canTransition('running', 'paused')).toBe(true);
    });

    it('running → rework 合法', () => {
      expect(canTransition('running', 'rework')).toBe(true);
    });

    it('done → running 非法', () => {
      expect(canTransition('done', 'running')).toBe(false);
    });

    it('waiting → done 非法（不能跳步骤）', () => {
      expect(canTransition('waiting', 'done')).toBe(false);
    });

    it('done → done 非法', () => {
      expect(canTransition('done', 'done')).toBe(false);
    });
  });

  describe('getNextStates', () => {
    it('running 的下一状态包含 paused/done/rework', () => {
      const next = getNextStates('running');
      expect(next).toContain('paused');
      expect(next).toContain('done');
      expect(next).toContain('rework');
    });

    it('done 没有下一状态', () => {
      expect(getNextStates('done')).toEqual([]);
    });
  });

  describe('isTerminal', () => {
    it('done 是终态', () => expect(isTerminal('done')).toBe(true));
    it('skipped 是终态', () => expect(isTerminal('skipped')).toBe(true));
    it('running 不是终态', () => expect(isTerminal('running')).toBe(false));
    it('waiting 不是终态', () => expect(isTerminal('waiting')).toBe(false));
  });

  describe('isActive', () => {
    it('running 是活跃态', () => expect(isActive('running')).toBe(true));
    it('paused 是活跃态', () => expect(isActive('paused')).toBe(true));
    it('rework 是活跃态', () => expect(isActive('rework')).toBe(true));
    it('done 不是活跃态', () => expect(isActive('done')).toBe(false));
    it('waiting 不是活跃态', () => expect(isActive('waiting')).toBe(false));
  });
});

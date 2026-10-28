import { describe, it, expect } from 'vitest';
import {
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentageSplit,
} from '@shared/split';

describe('shared/split.ts', () => {
  describe('calculateEqualSplit', () => {
    it('splits evenly when total is cleanly divisible', () => {
      const res = calculateEqualSplit(3000, ['p1', 'p2', 'p3']);
      expect(res.isValid).toBe(true);
      expect(res.remainderMinor).toBe(0);
      expect(res.shares).toEqual([
        { participantId: 'p1', amountMinor: 1000 },
        { participantId: 'p2', amountMinor: 1000 },
        { participantId: 'p3', amountMinor: 1000 },
      ]);
    });

    it('distributes leftover paise to the first N participants', () => {
      // 100 paise split 3 ways: 34, 33, 33 (100 = 33 * 3 + 1)
      const res = calculateEqualSplit(100, ['p1', 'p2', 'p3']);
      expect(res.isValid).toBe(true);
      expect(res.remainderMinor).toBe(0);
      expect(res.shares[0]?.amountMinor).toBe(34);
      expect(res.shares[1]?.amountMinor).toBe(33);
      expect(res.shares[2]?.amountMinor).toBe(33);
      expect(res.shares.reduce((s, c) => s + c.amountMinor, 0)).toBe(100);
    });

    it('handles excluded participants (split among subset of trip members)', () => {
      // Total 2500 paise split between p1 and p3 only (p2 excluded)
      const res = calculateEqualSplit(2500, ['p1', 'p3']);
      expect(res.isValid).toBe(true);
      expect(res.shares).toHaveLength(2);
      expect(res.shares.map((s) => s.participantId)).toEqual(['p1', 'p3']);
      expect(res.shares[0]?.amountMinor).toBe(1250);
      expect(res.shares[1]?.amountMinor).toBe(1250);
    });

    it('returns invalid with error message when participant list is empty', () => {
      const res = calculateEqualSplit(1000, []);
      expect(res.isValid).toBe(false);
      expect(res.remainderMinor).toBe(1000);
      expect(res.shares).toHaveLength(0);
    });
  });

  describe('calculateExactSplit', () => {
    it('is valid when custom amounts sum up exactly to total', () => {
      const res = calculateExactSplit(5000, [
        { participantId: 'p1', amountMinor: 2000 },
        { participantId: 'p2', amountMinor: 1500 },
        { participantId: 'p3', amountMinor: 1500 },
      ]);
      expect(res.isValid).toBe(true);
      expect(res.remainderMinor).toBe(0);
      expect(res.errorMessage).toBeUndefined();
    });

    it('detects under-allocated remainder when sum is less than total', () => {
      const res = calculateExactSplit(5000, [
        { participantId: 'p1', amountMinor: 2000 },
        { participantId: 'p2', amountMinor: 1000 },
      ]);
      expect(res.isValid).toBe(false);
      expect(res.remainderMinor).toBe(2000);
      expect(res.errorMessage).toContain('2000 paise remaining');
    });

    it('detects over-allocated remainder when sum exceeds total', () => {
      const res = calculateExactSplit(5000, [
        { participantId: 'p1', amountMinor: 3000 },
        { participantId: 'p2', amountMinor: 2500 },
      ]);
      expect(res.isValid).toBe(false);
      expect(res.remainderMinor).toBe(-500);
      expect(res.errorMessage).toContain('500 paise over-allocated');
    });
  });

  describe('calculatePercentageSplit', () => {
    it('calculates 50-50 percentage split accurately', () => {
      const res = calculatePercentageSplit(10000, [
        { participantId: 'p1', percentage: 50 },
        { participantId: 'p2', percentage: 50 },
      ]);
      expect(res.isValid).toBe(true);
      expect(res.remainderPercentage).toBe(0);
      expect(res.remainderMinor).toBe(0);
      expect(res.shares).toEqual([
        { participantId: 'p1', amountMinor: 5000, percentage: 50 },
        { participantId: 'p2', amountMinor: 5000, percentage: 50 },
      ]);
    });

    it('handles rounding in 33.33% / 33.33% / 33.34% splits with exact sum', () => {
      // 10000 paise
      const res = calculatePercentageSplit(10000, [
        { participantId: 'p1', percentage: 33.33 },
        { participantId: 'p2', percentage: 33.33 },
        { participantId: 'p3', percentage: 33.34 },
      ]);
      expect(res.isValid).toBe(true);
      const totalAllocated = res.shares.reduce((s, c) => s + c.amountMinor, 0);
      expect(totalAllocated).toBe(10000);
    });

    it('returns error when percentages do not sum to 100%', () => {
      const res = calculatePercentageSplit(10000, [
        { participantId: 'p1', percentage: 40 },
        { participantId: 'p2', percentage: 40 },
      ]);
      expect(res.isValid).toBe(false);
      expect(res.remainderPercentage).toBe(20);
      expect(res.errorMessage).toContain('20% left');
    });
  });
});

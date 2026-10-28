import { describe, it, expect } from 'vitest';
import { formatMoney, parseMoneyInput, distributeRemainder } from '@shared/money';

describe('shared/money.ts', () => {
  it('formats minor units to currency string correctly with Indian notation', () => {
    expect(formatMoney(124050, 'INR')).toBe('₹1,240.50');
    expect(formatMoney(10000000, 'INR')).toBe('₹1,00,000');
    expect(formatMoney(0, 'INR')).toBe('₹0');
  });

  it('formats negative amounts with minus sign', () => {
    expect(formatMoney(-50000, 'INR')).toBe('-₹500');
  });

  it('formats with explicit plus sign when showSign is true', () => {
    expect(formatMoney(35000, 'INR', { showSign: true })).toBe('+₹350');
  });

  it('parses user input strings into integer minor units without float loss', () => {
    expect(parseMoneyInput('1,240.50')).toBe(124050);
    expect(parseMoneyInput('₹ 500')).toBe(50000);
    expect(parseMoneyInput('99.9')).toBe(9990);
    expect(parseMoneyInput('')).toBe(0);
  });

  it('distributes remainder deterministically giving +1 minor unit to first N participants', () => {
    // 100 paise split between 3 people: 34, 33, 33 (100 = 33 * 3 + 1)
    expect(distributeRemainder(100, 3)).toEqual([34, 33, 33]);

    // 1000 paise split between 6 people:
    // 1000 / 6 = 166. Remainder = 4.
    // First 4 get 167, remaining 2 get 166. Total = 167*4 + 166*2 = 668 + 332 = 1000
    expect(distributeRemainder(1000, 6)).toEqual([167, 167, 167, 167, 166, 166]);
  });
});

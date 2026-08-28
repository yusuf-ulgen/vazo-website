import { describe, it, expect } from 'vitest';
import {
  toMinorUnits,
  fromMinorUnits,
  formatMinorMoney,
  calculateTaxIncluded,
  calculateOrderTotalMinor,
} from '@/shared/lib/money';

describe('Monetary Arithmetic & Minor Units Utilities (Phase 3.2)', () => {
  it('converts decimal amounts to integer minor units accurately', () => {
    expect(toMinorUnits(3000.0)).toBe(300000);
    expect(toMinorUnits(34.56)).toBe(3456);
    expect(toMinorUnits(0.99)).toBe(99);
    expect(toMinorUnits(0)).toBe(0);
    expect(toMinorUnits(0.004)).toBe(0); // Rounds down
    expect(toMinorUnits(0.005)).toBe(1); // Rounds up
    expect(toMinorUnits(NaN)).toBe(0);
    expect(toMinorUnits(Infinity)).toBe(0);
  });

  it('converts integer minor units back to standard decimal amounts', () => {
    expect(fromMinorUnits(300000)).toBe(3000.0);
    expect(fromMinorUnits(3456)).toBe(34.56);
    expect(fromMinorUnits(99)).toBe(0.99);
    expect(fromMinorUnits(0)).toBe(0);
    expect(fromMinorUnits(NaN)).toBe(0);
    expect(fromMinorUnits(Infinity)).toBe(0);
  });

  it('formats minor unit monetary values with currency symbols and decimals', () => {
    const formatted = formatMinorMoney(300000, 'TRY', 'tr-TR');
    // Normalized format check for 3.000,00 ₺
    expect(formatted).toContain('3.000,00');
    expect(formatted).toMatch(/₺|TRY/);

    const formattedUsd = formatMinorMoney(4550, 'USD', 'en-US');
    expect(formattedUsd).toBe('$45.50');
  });

  it('calculates included KDV backwards from gross minor units', () => {
    // 1200 minor units at 20% KDV -> 1000 base + 200 KDV
    expect(calculateTaxIncluded(1200, 0.2)).toBe(200);

    // 300000 minor units at 20% KDV -> 300000 - (300000 / 1.2) = 300000 - 250000 = 50000
    expect(calculateTaxIncluded(300000, 0.2)).toBe(50000);

    // Zero or negative amounts
    expect(calculateTaxIncluded(0, 0.2)).toBe(0);
    expect(calculateTaxIncluded(-100, 0.2)).toBe(0);
    expect(calculateTaxIncluded(1000, 0)).toBe(0);
  });

  it('computes order total minor units enforcing subtotal + shipping - discount integrity', () => {
    // 3000.00 subtotal + 150.00 shipping - 100.00 discount = 3050.00 total
    expect(calculateOrderTotalMinor(300000, 15000, 10000)).toBe(305000);

    // 0 shipping, 0 discount
    expect(calculateOrderTotalMinor(50000)).toBe(50000);

    // Discount larger than subtotal + shipping caps total at 0
    expect(calculateOrderTotalMinor(5000, 1000, 10000)).toBe(0);
  });
});

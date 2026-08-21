import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDimensions, formatDate } from '@/shared/lib/formatters';

describe('Formatters Utility', () => {
  it('formats currency correctly into TRY format', () => {
    const formatted = formatCurrency(2450);
    expect(formatted).toContain('2.450');
    expect(formatted).toMatch(/₺|TL|TRY/);
  });

  it('formats product dimensions correctly', () => {
    const formatted = formatDimensions({
      heightCm: 28,
      diameterCm: 16,
      weightKg: 1.8,
    });
    expect(formatted).toBe('Ø16 × Y28 cm');
  });

  it('handles missing dimensions gracefully', () => {
    const formatted = formatDimensions(undefined);
    expect(formatted).toBe('Standart');
  });

  it('formats ISO dates correctly', () => {
    const formatted = formatDate('2026-08-01T10:00:00Z');
    expect(formatted).toBeTruthy();
    expect(formatted).toContain('2026');
  });
});

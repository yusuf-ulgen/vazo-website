import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDimensions, formatDate } from '@/shared/lib/formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('formats integer Turkish Lira correctly', () => {
      const formatted = formatCurrency(1850);
      expect(formatted).toMatch(/1\.850/);
      expect(formatted).toMatch(/₺/);
    });

    it('formats decimal values up to 2 fraction digits', () => {
      const formatted = formatCurrency(1387.5);
      expect(formatted).toMatch(/1\.387,5/);
    });

    it('handles zero and negative amounts', () => {
      expect(formatCurrency(0)).toMatch(/0/);
      expect(formatCurrency(-500)).toBe('-₺500');
    });

    it('supports custom locale and currency code', () => {
      const formatted = formatCurrency(100, 'en-US', 'USD');
      expect(formatted).toBe('$100');
    });
  });

  describe('formatDimensions', () => {
    it('formats diameter and height properly', () => {
      expect(formatDimensions({ diameterCm: 18, heightCm: 32, weightKg: 1.8 })).toBe('Ø18 × Y32 cm');
    });

    it('returns "Standart" if dimensions are undefined or null', () => {
      expect(formatDimensions(undefined)).toBe('Standart');
    });
  });

  describe('formatDate', () => {
    it('formats valid ISO date string to Turkish short format', () => {
      const result = formatDate('2026-08-21T12:00:00Z');
      expect(result).toMatch(/21/);
      expect(result).toMatch(/2026/);
    });

    it('returns raw string if formatting fails or throws', () => {
      expect(formatDate('invalid-date-string')).toBe('invalid-date-string');
    });

    it('supports custom locale', () => {
      const result = formatDate('2026-08-21T12:00:00Z', 'en-US');
      expect(result).toContain('2026');
      expect(result).toContain('Aug');
    });
  });
});

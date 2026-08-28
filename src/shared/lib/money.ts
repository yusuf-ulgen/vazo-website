/**
 * Monetary Arithmetic & Exact Minor Units Utilities
 * Standard: ISO-4217 minor unit representations (Integer kuruş/cents)
 * Absolute Rule: No JavaScript floating point math for authoritative totals.
 */

export type CurrencyCode = 'TRY' | 'USD' | 'EUR' | 'GBP';

export interface Money {
  amountMinor: number;
  currency: CurrencyCode;
}

/**
 * Converts decimal currency amount to integer minor units (e.g. 3000.00 TRY -> 300000 minor units).
 * Uses exact integer scaling with round to eliminate IEEE 754 floating point inaccuracies.
 */
export function toMinorUnits(amount: number): number {
  if (typeof amount !== 'number' || Number.isNaN(amount) || !Number.isFinite(amount)) {
    return 0;
  }
  return Math.round(amount * 100);
}

/**
 * Converts integer minor units to standard decimal representation (e.g. 300000 -> 3000.00).
 */
export function fromMinorUnits(amountMinor: number): number {
  if (typeof amountMinor !== 'number' || Number.isNaN(amountMinor) || !Number.isFinite(amountMinor)) {
    return 0;
  }
  return Number((Math.round(amountMinor) / 100).toFixed(2));
}

/**
 * Formats minor unit monetary value to localized string (e.g. 300000 minor TRY -> "3.000,00 ₺").
 */
export function formatMinorMoney(
  amountMinor: number,
  currency: CurrencyCode = 'TRY',
  locale = 'tr-TR'
): string {
  const decimalAmount = fromMinorUnits(amountMinor);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(decimalAmount);
}

export const formatMoneyMinor = formatMinorMoney;

/**
 * Calculates VAT/KDV extracted from a KDV-inclusive gross total in minor units.
 * Formula: Tax = Gross - (Gross / (1 + taxRate))
 * Default Turkish KDV rate: 20% (0.20)
 */
export function calculateTaxIncluded(totalMinor: number, taxRate = 0.2): number {
  if (totalMinor <= 0 || taxRate <= 0) return 0;
  const taxableSubtotal = totalMinor / (1 + taxRate);
  return Math.round(totalMinor - taxableSubtotal);
}

/**
 * Verifies and computes order total minor units.
 * Formula: Total = Subtotal + Shipping - Discount
 */
export function calculateOrderTotalMinor(
  subtotalMinor: number,
  shippingMinor: number = 0,
  discountMinor: number = 0
): number {
  const safeSubtotal = Math.max(0, Math.round(subtotalMinor || 0));
  const safeShipping = Math.max(0, Math.round(shippingMinor || 0));
  const safeDiscount = Math.max(0, Math.round(discountMinor || 0));
  return Math.max(0, safeSubtotal + safeShipping - safeDiscount);
}

import { ProductDimensions } from '@/entities/product/types';

/**
 * Formats a numeric price into Turkish Lira currency format.
 */
export function formatCurrency(amount: number, locale = 'tr-TR', currency = 'TRY'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats product physical dimensions into a concise string (e.g. "Ø18 x H32 cm").
 */
export function formatDimensions(dimensions?: ProductDimensions): string {
  if (!dimensions) return 'Standart';
  return `Ø${dimensions.diameterCm} × Y${dimensions.heightCm} cm`;
}

/**
 * Formats an ISO date string into readable localized format (Date only).
 */
export function formatDate(isoString: string, locale = 'tr-TR'): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Formats an ISO date string into readable localized format with time.
 */
export function formatDateTime(isoString: string, locale = 'tr-TR'): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

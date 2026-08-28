import {
  ShippingZone,
  ShippingResolutionInput,
  ShippingResolutionResult,
} from '../types';

/**
 * Pure, deterministic Shipping Rate Resolver.
 * Resolves active shipping rates according to destination country, channel, subtotal, and currency.
 */
export function resolveShippingLocally(
  zones: ShippingZone[],
  input: ShippingResolutionInput
): ShippingResolutionResult {
  const countryCode = (input.country_code || '').trim().toUpperCase();
  const channel = input.channel || 'retail';
  const subtotalMinor = Math.max(0, Math.round(input.subtotal_minor || 0));
  const currency = input.currency || 'TRY';

  if (!countryCode) {
    return {
      supported: false,
      shipping_minor: 0,
      free_shipping_applied: false,
      message: 'Lütfen geçerli bir teslimat ülkesi seçiniz.',
    };
  }

  // 1. Find matching active zones containing the active country
  const matchingZones = zones
    .filter((zone) => {
      if (!zone.active) return false;
      if (channel === 'retail' && !zone.retail_enabled) return false;
      if (channel === 'wholesale' && !zone.wholesale_enabled) return false;

      const hasCountry = (zone.countries || []).some(
        (c) => c.active && c.country_code.toUpperCase() === countryCode
      );
      return hasCountry;
    })
    .sort((a, b) => b.priority - a.priority);

  if (matchingZones.length === 0) {
    return {
      supported: false,
      shipping_minor: 0,
      free_shipping_applied: false,
      message: 'Bu teslimat ülkesi henüz aktif değil.',
    };
  }

  // 2. Select the top priority zone and evaluate its rates
  for (const zone of matchingZones) {
    const eligibleRates = (zone.rates || [])
      .filter((rate) => {
        if (!rate.active) return false;
        if (rate.currency !== currency) return false;
        if (rate.minimum_order_minor != null && subtotalMinor < rate.minimum_order_minor) {
          return false;
        }
        if (rate.maximum_order_minor != null && subtotalMinor > rate.maximum_order_minor) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return a.flat_amount_minor - b.flat_amount_minor;
      });

    const topRate = eligibleRates[0];
    if (topRate) {
      const isFree =
        topRate.free_shipping_threshold_minor != null &&
        subtotalMinor >= topRate.free_shipping_threshold_minor;

      return {
        supported: true,
        zone_id: zone.id,
        zone_name: zone.name,
        rate_id: topRate.id,
        rate_name: topRate.name,
        shipping_minor: isFree ? 0 : topRate.flat_amount_minor,
        free_shipping_applied: isFree,
        estimated_delivery_text: topRate.estimated_delivery_text || null,
      };
    }
  }

  // If zone has countries but no active rate configured for channel/currency/bounds
  return {
    supported: false,
    shipping_minor: 0,
    free_shipping_applied: false,
    message: 'Bu teslimat ülkesi için aktif kargo tarifesi bulunamadı.',
  };
}

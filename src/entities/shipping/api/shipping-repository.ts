import { getSupabase } from '@/shared/lib/supabase';
import {
  ShippingResolutionInput,
  ShippingResolutionResult,
  ShippingZoneCountry,
  ShippingZone,
} from '../types';
import { resolveShippingLocally } from '../lib/shipping-resolver';

export const shippingRepository = {
  /**
   * Fetches all active destination countries enabled for shipping.
   */
  async getActiveShippingCountries(): Promise<ShippingZoneCountry[]> {
    const client = getSupabase();
    const { data, error } = await client
      .from('shipping_zone_countries')
      .select('id, zone_id, country_code, country_name, active, created_at')
      .eq('active', true)
      .order('country_name', { ascending: true });

    if (error) {
      // Return Turkey baseline fallback if database read fails
      return [
        {
          id: '70000000-0000-0000-0000-000000000001',
          zone_id: '70000000-0000-0000-0000-000000000001',
          country_code: 'TR',
          country_name: 'Türkiye',
          active: true,
          created_at: new Date().toISOString(),
        },
      ];
    }

    return (data || []) as ShippingZoneCountry[];
  },

  /**
   * Resolves authoritative shipping rate for given destination country and cart parameters.
   */
  async resolveShipping(input: ShippingResolutionInput): Promise<ShippingResolutionResult> {
    const countryCode = (input.country_code || '').trim().toUpperCase();
    if (!countryCode) {
      return {
        supported: false,
        shipping_minor: 0,
        free_shipping_applied: false,
        message: 'Lütfen geçerli bir teslimat ülkesi seçiniz.',
      };
    }

    const client = getSupabase();

    try {
      const { data, error } = await client.rpc('resolve_shipping_rate', {
        p_country_code: countryCode,
        p_channel: input.channel || 'retail',
        p_subtotal_minor: input.subtotal_minor || 0,
        p_currency: input.currency || 'TRY',
      });

      if (error || !data || data.length === 0) {
        throw error || new Error('RPC resolution returned no data');
      }

      const row = data[0];
      if (!row.supported) {
        return {
          supported: false,
          shipping_minor: 0,
          free_shipping_applied: false,
          message: 'Bu teslimat ülkesi henüz aktif değil.',
        };
      }

      return {
        supported: true,
        zone_id: row.zone_id,
        zone_name: row.zone_name,
        rate_id: row.rate_id,
        rate_name: row.rate_name,
        shipping_minor: Number(row.shipping_minor) || 0,
        free_shipping_applied: Boolean(row.free_shipping_applied),
        estimated_delivery_text: row.estimated_delivery_text || null,
      };
    } catch {
      // Fallback local resolution using baseline Turkey setup
      const fallbackZones: ShippingZone[] = [
        {
          id: '70000000-0000-0000-0000-000000000001',
          name: 'Türkiye İçi',
          active: true,
          priority: 10,
          retail_enabled: true,
          wholesale_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          countries: [
            {
              id: 'c-tr-01',
              zone_id: '70000000-0000-0000-0000-000000000001',
              country_code: 'TR',
              country_name: 'Türkiye',
              active: true,
              created_at: new Date().toISOString(),
            },
          ],
          rates: [
            {
              id: 'r-tr-01',
              zone_id: '70000000-0000-0000-0000-000000000001',
              name: 'Standart Yurtiçi Teslimat',
              currency: 'TRY',
              flat_amount_minor: 15000,
              free_shipping_threshold_minor: 500000,
              estimated_delivery_text: '2–4 İş Günü',
              active: true,
              priority: 10,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        },
      ];

      return resolveShippingLocally(fallbackZones, input);
    }
  },
};

import { getSupabase } from '@/shared/lib/supabase';
import { adminAuditRepository } from '@/admin/audit/api/admin-audit-repository';
import {
  ShippingZone,
  ShippingZoneCountry,
  ShippingRate,
  CreateShippingZoneInput,
  UpdateShippingZoneInput,
  CreateShippingCountryInput,
  CreateShippingRateInput,
  UpdateShippingRateInput,
} from '@/entities/shipping/types';

export const adminShippingRepository = {
  /**
   * Fetches all shipping zones with nested countries and rates for Admin.
   */
  async getZones(): Promise<ShippingZone[]> {
    const client = getSupabase();
    const { data: zones, error: zonesErr } = await client
      .from('shipping_zones')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (zonesErr) throw new Error(`Bölgeler yüklenirken hata oluştu: ${zonesErr.message}`);

    const { data: countries, error: countErr } = await client
      .from('shipping_zone_countries')
      .select('*')
      .order('country_name', { ascending: true });

    if (countErr) throw new Error(`Ülkeler yüklenirken hata oluştu: ${countErr.message}`);

    const { data: rates, error: ratesErr } = await client
      .from('shipping_rates')
      .select('*')
      .order('priority', { ascending: false })
      .order('flat_amount_minor', { ascending: true });

    if (ratesErr) throw new Error(`Kargo tarifeleri yüklenirken hata oluştu: ${ratesErr.message}`);

    return (zones || []).map((zone) => ({
      ...zone,
      countries: (countries || []).filter((c) => c.zone_id === zone.id),
      rates: (rates || []).filter((r) => r.zone_id === zone.id),
    })) as ShippingZone[];
  },

  /**
   * Creates a new shipping zone.
   */
  async createZone(input: CreateShippingZoneInput): Promise<ShippingZone> {
    const name = input.name.trim();
    if (!name) throw new Error('Bölge adı zorunludur.');

    const client = getSupabase();
    const payload = {
      name,
      description: input.description?.trim() || null,
      active: input.active !== undefined ? input.active : true,
      priority: input.priority || 0,
      retail_enabled: input.retail_enabled !== undefined ? input.retail_enabled : true,
      wholesale_enabled: input.wholesale_enabled !== undefined ? input.wholesale_enabled : false,
    };

    const { data, error } = await client
      .from('shipping_zones')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw new Error(`Bölge oluşturulurken hata: ${error.message}`);

    try {
      await adminAuditRepository.logAuditEvent(
        'CREATE',
        'shipping_zone',
        data.id,
        data.name,
        { priority: data.priority }
      );
    } catch (e) {
      console.warn('[adminShippingRepository] audit log warning:', e);
    }

    return { ...data, countries: [], rates: [] } as ShippingZone;
  },

  /**
   * Updates an existing shipping zone.
   */
  async updateZone(id: string, input: UpdateShippingZoneInput): Promise<ShippingZone> {
    if (!id) throw new Error('Bölge kimliği zorunludur.');

    const client = getSupabase();
    const payload: Record<string, unknown> = {};
    if (input.name !== undefined) payload.name = input.name.trim();
    if (input.description !== undefined) payload.description = input.description?.trim() || null;
    if (input.active !== undefined) payload.active = input.active;
    if (input.priority !== undefined) payload.priority = input.priority;
    if (input.retail_enabled !== undefined) payload.retail_enabled = input.retail_enabled;
    if (input.wholesale_enabled !== undefined) payload.wholesale_enabled = input.wholesale_enabled;

    const { data, error } = await client
      .from('shipping_zones')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(`Bölge güncellenirken hata: ${error.message}`);

    try {
      await adminAuditRepository.logAuditEvent(
        'UPDATE',
        'shipping_zone',
        data.id,
        data.name,
        payload
      );
    } catch (e) {
      console.warn('[adminShippingRepository] audit log warning:', e);
    }

    return data as ShippingZone;
  },

  /**
   * Deletes a shipping zone and its child countries/rates (cascade).
   */
  async deleteZone(id: string): Promise<void> {
    if (!id) throw new Error('Bölge kimliği zorunludur.');

    const client = getSupabase();
    const { error } = await client.from('shipping_zones').delete().eq('id', id);
    if (error) throw new Error(`Bölge silinirken hata: ${error.message}`);

    try {
      await adminAuditRepository.logAuditEvent(
        'DELETE',
        'shipping_zone',
        id,
        `Zone ${id}`,
        {}
      );
    } catch (e) {
      console.warn('[adminShippingRepository] audit log warning:', e);
    }
  },

  /**
   * Adds a destination country to a shipping zone.
   */
  async addCountryToZone(
    zoneId: string,
    input: CreateShippingCountryInput
  ): Promise<ShippingZoneCountry> {
    if (!zoneId) throw new Error('Bölge kimliği zorunludur.');
    const countryCode = input.country_code.trim().toUpperCase();
    const countryName = input.country_name.trim();
    if (countryCode.length !== 2) throw new Error('Ülke kodu 2 haneli ISO formatında olmalıdır.');
    if (!countryName) throw new Error('Ülke adı zorunludur.');

    const client = getSupabase();
    const payload = {
      zone_id: zoneId,
      country_code: countryCode,
      country_name: countryName,
      active: input.active !== undefined ? input.active : true,
    };

    const { data, error } = await client
      .from('shipping_zone_countries')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw new Error(`Ülke eklenirken hata: ${error.message}`);

    try {
      await adminAuditRepository.logAuditEvent(
        'CREATE',
        'shipping_zone_country',
        data.id,
        `${countryName} (${countryCode})`,
        { zone_id: zoneId }
      );
    } catch (e) {
      console.warn('[adminShippingRepository] audit log warning:', e);
    }

    return data as ShippingZoneCountry;
  },

  /**
   * Removes a country from a shipping zone.
   */
  async removeCountryFromZone(countryId: string): Promise<void> {
    if (!countryId) throw new Error('Ülke kimliği zorunludur.');

    const client = getSupabase();
    const { error } = await client.from('shipping_zone_countries').delete().eq('id', countryId);
    if (error) throw new Error(`Ülke silinirken hata: ${error.message}`);

    try {
      await adminAuditRepository.logAuditEvent(
        'DELETE',
        'shipping_zone_country',
        countryId,
        `Country ${countryId}`,
        {}
      );
    } catch (e) {
      console.warn('[adminShippingRepository] audit log warning:', e);
    }
  },

  /**
   * Creates a shipping rate inside a zone.
   */
  async createRate(zoneId: string, input: CreateShippingRateInput): Promise<ShippingRate> {
    if (!zoneId) throw new Error('Bölge kimliği zorunludur.');
    const name = input.name.trim();
    if (!name) throw new Error('Tarife adı zorunludur.');

    const client = getSupabase();
    const payload = {
      zone_id: zoneId,
      name,
      currency: input.currency || 'TRY',
      flat_amount_minor: Math.max(0, Math.round(input.flat_amount_minor || 0)),
      free_shipping_threshold_minor:
        input.free_shipping_threshold_minor != null
          ? Math.max(0, Math.round(input.free_shipping_threshold_minor))
          : null,
      minimum_order_minor:
        input.minimum_order_minor != null
          ? Math.max(0, Math.round(input.minimum_order_minor))
          : null,
      maximum_order_minor:
        input.maximum_order_minor != null
          ? Math.max(0, Math.round(input.maximum_order_minor))
          : null,
      estimated_delivery_text: input.estimated_delivery_text?.trim() || null,
      active: input.active !== undefined ? input.active : true,
      priority: input.priority || 0,
    };

    const { data, error } = await client
      .from('shipping_rates')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw new Error(`Tarife oluşturulurken hata: ${error.message}`);

    try {
      await adminAuditRepository.logAuditEvent(
        'CREATE',
        'shipping_rate',
        data.id,
        data.name,
        { zone_id: zoneId, flat_amount_minor: data.flat_amount_minor }
      );
    } catch (e) {
      console.warn('[adminShippingRepository] audit log warning:', e);
    }

    return data as ShippingRate;
  },

  /**
   * Updates an existing shipping rate.
   */
  async updateRate(rateId: string, input: UpdateShippingRateInput): Promise<ShippingRate> {
    if (!rateId) throw new Error('Tarife kimliği zorunludur.');

    const client = getSupabase();
    const payload: Record<string, unknown> = {};
    if (input.name !== undefined) payload.name = input.name.trim();
    if (input.currency !== undefined) payload.currency = input.currency;
    if (input.flat_amount_minor !== undefined) {
      payload.flat_amount_minor = Math.max(0, Math.round(input.flat_amount_minor));
    }
    if (input.free_shipping_threshold_minor !== undefined) {
      payload.free_shipping_threshold_minor =
        input.free_shipping_threshold_minor != null
          ? Math.max(0, Math.round(input.free_shipping_threshold_minor))
          : null;
    }
    if (input.minimum_order_minor !== undefined) {
      payload.minimum_order_minor =
        input.minimum_order_minor != null
          ? Math.max(0, Math.round(input.minimum_order_minor))
          : null;
    }
    if (input.maximum_order_minor !== undefined) {
      payload.maximum_order_minor =
        input.maximum_order_minor != null
          ? Math.max(0, Math.round(input.maximum_order_minor))
          : null;
    }
    if (input.estimated_delivery_text !== undefined) {
      payload.estimated_delivery_text = input.estimated_delivery_text?.trim() || null;
    }
    if (input.active !== undefined) payload.active = input.active;
    if (input.priority !== undefined) payload.priority = input.priority;

    const { data, error } = await client
      .from('shipping_rates')
      .update(payload)
      .eq('id', rateId)
      .select('*')
      .single();

    if (error) throw new Error(`Tarife güncellenirken hata: ${error.message}`);

    try {
      await adminAuditRepository.logAuditEvent(
        'UPDATE',
        'shipping_rate',
        data.id,
        data.name,
        payload
      );
    } catch (e) {
      console.warn('[adminShippingRepository] audit log warning:', e);
    }

    return data as ShippingRate;
  },

  /**
   * Deletes a shipping rate.
   */
  async deleteRate(rateId: string): Promise<void> {
    if (!rateId) throw new Error('Tarife kimliği zorunludur.');

    const client = getSupabase();
    const { error } = await client.from('shipping_rates').delete().eq('id', rateId);
    if (error) throw new Error(`Tarife silinirken hata: ${error.message}`);

    try {
      await adminAuditRepository.logAuditEvent(
        'DELETE',
        'shipping_rate',
        rateId,
        `Rate ${rateId}`,
        {}
      );
    } catch (e) {
      console.warn('[adminShippingRepository] audit log warning:', e);
    }
  },
};

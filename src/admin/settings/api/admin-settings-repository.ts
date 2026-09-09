import { requireAdminSupabase } from '@/admin/shared/api/require-admin-supabase';
import {
  PublicSiteSettings,
  DEFAULT_PUBLIC_SITE_SETTINGS,
  GeneralSettings,
  ContactSettings,
  CommerceSettings,
  SocialSettings,
  SellerLegalSettings,
  DEFAULT_SELLER_LEGAL,
  CheckoutReadiness,
} from '@/entities/settings/types';
import { siteSettingsStore } from '@/shared/stores/settings-store';

interface SiteSettingRow {
  key: string;
  value: Record<string, unknown>;
  is_public?: boolean;
}

export const adminSettingsRepository = {
  async getSettings(): Promise<PublicSiteSettings> {
    const client = requireAdminSupabase();

    const { data, error } = await client
      .from('site_settings')
      .select('key, value, is_public')
      .in('key', ['general', 'contact', 'commerce', 'social']);

    if (error) {
      console.error('[adminSettingsRepository.getSettings] Error:', error.message);
      throw new Error(`Ayarlar yüklenemedi: ${error.message}`);
    }

    const rows = (data || []) as SiteSettingRow[];
    const generalRow = rows.find((r) => r.key === 'general')?.value || {};
    const contactRow = rows.find((r) => r.key === 'contact')?.value || {};
    const commerceRow = rows.find((r) => r.key === 'commerce')?.value || {};
    const socialRow = rows.find((r) => r.key === 'social')?.value || {};

    const settings: PublicSiteSettings = {
      general: {
        brandName: (generalRow.brand_name as string) || DEFAULT_PUBLIC_SITE_SETTINGS.general.brandName,
        tagline: (generalRow.tagline as string) || DEFAULT_PUBLIC_SITE_SETTINGS.general.tagline,
        description: (generalRow.description as string) || DEFAULT_PUBLIC_SITE_SETTINGS.general.description,
      },
      contact: {
        email: (contactRow.email as string) || DEFAULT_PUBLIC_SITE_SETTINGS.contact.email,
        wholesaleEmail: (contactRow.wholesale_email as string) || DEFAULT_PUBLIC_SITE_SETTINGS.contact.wholesaleEmail,
        phone: (contactRow.phone as string) || DEFAULT_PUBLIC_SITE_SETTINGS.contact.phone,
        address: (contactRow.address as string) || DEFAULT_PUBLIC_SITE_SETTINGS.contact.address,
        businessHours: (contactRow.business_hours as string) || DEFAULT_PUBLIC_SITE_SETTINGS.contact.businessHours,
      },
      commerce: {
        freeShippingThreshold:
          typeof commerceRow.free_shipping_threshold === 'number'
            ? commerceRow.free_shipping_threshold
            : DEFAULT_PUBLIC_SITE_SETTINGS.commerce.freeShippingThreshold,
        shippingEstimateText:
          (commerceRow.shipping_estimate_text as string) || DEFAULT_PUBLIC_SITE_SETTINGS.commerce.shippingEstimateText,
        shippingSummary:
          (commerceRow.shipping_summary as string) || DEFAULT_PUBLIC_SITE_SETTINGS.commerce.shippingSummary,
        returnsPolicyText:
          (commerceRow.returns_policy_text as string) || DEFAULT_PUBLIC_SITE_SETTINGS.commerce.returnsPolicyText,
        checkoutEnabled: typeof commerceRow.checkout_enabled === 'boolean'
          ? commerceRow.checkout_enabled
          : false,
      },
      social: {
        instagram: (socialRow.instagram as string) || DEFAULT_PUBLIC_SITE_SETTINGS.social.instagram,
        facebook: (socialRow.facebook as string) || DEFAULT_PUBLIC_SITE_SETTINGS.social.facebook,
        pinterest: (socialRow.pinterest as string) || DEFAULT_PUBLIC_SITE_SETTINGS.social.pinterest,
      },
    };

    return settings;
  },

  async updateGeneralSettings(data: GeneralSettings): Promise<void> {
    const client = requireAdminSupabase();

    const payload = {
      brand_name: data.brandName.trim(),
      tagline: data.tagline.trim(),
      description: data.description.trim(),
    };

    const { error } = await client
      .from('site_settings')
      .upsert(
        { key: 'general', value: payload, is_public: true, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) {
      console.error('[adminSettingsRepository.updateGeneralSettings] Error:', error.message);
      throw new Error(`Genel ayarlar kaydedilemedi: ${error.message}`);
    }

    await siteSettingsStore.fetchSettings(true).catch(() => {});
  },

  async updateContactSettings(data: ContactSettings): Promise<void> {
    const client = requireAdminSupabase();

    const payload = {
      email: data.email.trim(),
      wholesale_email: data.wholesaleEmail.trim(),
      phone: data.phone.trim(),
      address: data.address.trim(),
      business_hours: data.businessHours.trim(),
    };

    const { error } = await client
      .from('site_settings')
      .upsert(
        { key: 'contact', value: payload, is_public: true, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) {
      console.error('[adminSettingsRepository.updateContactSettings] Error:', error.message);
      throw new Error(`İletişim ayarları kaydedilemedi: ${error.message}`);
    }

    await siteSettingsStore.fetchSettings(true).catch(() => {});
  },

  async updateCommerceSettings(data: CommerceSettings): Promise<void> {
    const client = requireAdminSupabase();

    let rpcSuccess = false;
    try {
      const { error } = await client.rpc('admin_update_commerce_settings', {
        p_free_shipping_threshold: Number(data.freeShippingThreshold) || 0,
        p_shipping_estimate_text: data.shippingEstimateText.trim(),
        p_shipping_summary: data.shippingSummary.trim(),
        p_returns_policy_text: data.returnsPolicyText.trim(),
      });
      if (!error) {
        rpcSuccess = true;
      } else {
        console.warn('[adminSettingsRepository.updateCommerceSettings] RPC unavailable, falling back to direct update:', error.message);
      }
    } catch (rpcErr) {
      console.warn('[adminSettingsRepository.updateCommerceSettings] RPC call failed, falling back to direct update:', rpcErr);
    }

    if (!rpcSuccess) {
      // Direct table upsert fallback preserving existing keys (like checkout_enabled)
      const { data: currentCommerce } = await client
        .from('site_settings')
        .select('value')
        .eq('key', 'commerce')
        .maybeSingle();

      const existingValue = (currentCommerce?.value as Record<string, unknown>) || {};
      const mergedValue = {
        ...existingValue,
        free_shipping_threshold: Number(data.freeShippingThreshold) || 0,
        shipping_estimate_text: data.shippingEstimateText.trim(),
        shipping_summary: data.shippingSummary.trim(),
        returns_policy_text: data.returnsPolicyText.trim(),
      };

      const { error: upsertError } = await client
        .from('site_settings')
        .upsert(
          {
            key: 'commerce',
            value: mergedValue,
            is_public: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );

      if (upsertError) {
        console.error('[adminSettingsRepository.updateCommerceSettings] Fallback Error:', upsertError.message);
        throw new Error(`E-Ticaret ayarları kaydedilemedi: ${upsertError.message}`);
      }
    }

    await siteSettingsStore.fetchSettings(true).catch(() => {});
  },

  async updateSocialSettings(data: SocialSettings): Promise<void> {
    const client = requireAdminSupabase();

    const payload = {
      instagram: data.instagram.trim(),
      facebook: data.facebook.trim(),
      pinterest: data.pinterest.trim(),
    };

    const { error } = await client
      .from('site_settings')
      .upsert(
        { key: 'social', value: payload, is_public: true, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) {
      console.error('[adminSettingsRepository.updateSocialSettings] Error:', error.message);
      throw new Error(`Sosyal medya ayarları kaydedilemedi: ${error.message}`);
    }

    await siteSettingsStore.fetchSettings(true).catch(() => {});
  },

  async getSellerLegal(): Promise<SellerLegalSettings> {
    const client = requireAdminSupabase();
    const { data, error } = await client
      .from('site_settings')
      .select('value')
      .eq('key', 'seller_legal')
      .single();

    if (error || !data) return { ...DEFAULT_SELLER_LEGAL };
    const v = (data.value as Record<string, unknown>) || {};
    return {
      business_type: (v['business_type'] as string) || '',
      owner_full_name: (v['owner_full_name'] as string) || '',
      legal_trade_title: (v['legal_trade_title'] as string) || '',
      brand_name: (v['brand_name'] as string | null) ?? null,
      tax_office: (v['tax_office'] as string) || '',
      tax_number: (v['tax_number'] as string) || '',
      registered_address: (v['registered_address'] as string) || '',
      kep_address: (v['kep_address'] as string) || '',
      business_email: (v['business_email'] as string) || '',
      business_phone: (v['business_phone'] as string) || '',
      chamber_name: (v['chamber_name'] as string | null) ?? null,
      chamber_registration_number: (v['chamber_registration_number'] as string | null) ?? null,
      trade_registry_number: (v['trade_registry_number'] as string | null) ?? null,
      mersis_number: (v['mersis_number'] as string | null) ?? null,
    };
  },

  async updateSellerLegal(data: SellerLegalSettings): Promise<void> {
    const client = requireAdminSupabase();
    const payload: Record<string, unknown> = {
      business_type: data.business_type.trim(),
      owner_full_name: data.owner_full_name.trim(),
      legal_trade_title: data.legal_trade_title.trim(),
      brand_name: data.brand_name?.trim() || null,
      tax_office: data.tax_office.trim(),
      tax_number: data.tax_number.trim(),
      registered_address: data.registered_address.trim(),
      kep_address: data.kep_address.trim(),
      business_email: data.business_email.trim(),
      business_phone: data.business_phone.trim(),
      chamber_name: data.chamber_name?.trim() || null,
      chamber_registration_number: data.chamber_registration_number?.trim() || null,
      trade_registry_number: data.trade_registry_number?.trim() || null,
      mersis_number: data.mersis_number?.trim() || null,
    };
    const { error } = await client
      .from('site_settings')
      .upsert(
        { key: 'seller_legal', value: payload, is_public: true, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
    if (error) throw new Error(`Satıcı bilgileri kaydedilemedi: ${error.message}`);
  },

  async getCheckoutReadiness(): Promise<CheckoutReadiness> {
    const client = requireAdminSupabase();

    // 1. Try edge function first (which can detect Deno environment secrets presence)
    try {
      const { data, error } = await client.functions.invoke('admin-readiness');
      if (!error && data && typeof data.seller_legal_complete === 'boolean') {
        return data as CheckoutReadiness;
      }
    } catch {
      // Fallback to database RPC
    }

    // 2. Direct database RPC fallback
    try {
      const { data, error } = await client.rpc('get_checkout_readiness');
      if (!error && data && typeof (data as CheckoutReadiness).seller_legal_complete === 'boolean') {
        return data as CheckoutReadiness;
      }
    } catch {
      // Fallback to direct client-side calculation
    }

    // 3. Robust client-side fallback if RPC is not present in database
    return await this.calculateCheckoutReadinessFallback();
  },

  async calculateCheckoutReadinessFallback(): Promise<CheckoutReadiness> {
    const client = requireAdminSupabase();
    let sellerLegal: Record<string, unknown> = {};
    let commerceSettings: Record<string, unknown> = {};
    let hasActiveShipping = false;

    try {
      const { data } = await client
        .from('site_settings')
        .select('key, value')
        .in('key', ['seller_legal', 'commerce']);

      if (data) {
        for (const row of data) {
          if (row.key === 'seller_legal') sellerLegal = (row.value as Record<string, unknown>) || {};
          if (row.key === 'commerce') commerceSettings = (row.value as Record<string, unknown>) || {};
        }
      }
    } catch {
      // ignore
    }

    try {
      const { data: zones } = await client
        .from('shipping_zones')
        .select('id, active')
        .eq('active', true)
        .limit(1);

      hasActiveShipping = Boolean(zones && zones.length > 0);
    } catch {
      hasActiveShipping = false;
    }

    const requiredFields = [
      'business_type',
      'owner_full_name',
      'legal_trade_title',
      'tax_office',
      'tax_number',
      'registered_address',
      'kep_address',
      'business_email',
      'business_phone',
    ];

    const sellerFieldsSummary: Record<string, boolean> = {};
    let allFilled = true;

    for (const field of requiredFields) {
      const val = sellerLegal[field];
      const isFilled = typeof val === 'string' && val.trim().length > 0;
      sellerFieldsSummary[field] = isFilled;
      if (!isFilled) allFilled = false;
    }

    const mersis = sellerLegal['mersis_number'];
    sellerFieldsSummary['mersis_number'] = typeof mersis === 'string' && mersis.trim().length > 0;

    const checkoutEnabled = Boolean(commerceSettings['checkout_enabled']);

    return {
      seller_legal_complete: allFilled,
      checkout_enabled: checkoutEnabled,
      has_active_shipping: hasActiveShipping,
      paytr_secrets_present: null,
      gmail_secrets_present: null,
      seller_fields_summary: sellerFieldsSummary,
    };
  },

  async setCheckoutEnabled(enabled: boolean): Promise<{ success: boolean; error?: string }> {
    const client = requireAdminSupabase();
    try {
      const { data, error } = await client.rpc('admin_enable_checkout', { p_enabled: enabled });
      if (!error && data) {
        const result = data as { success: boolean; error?: string };
        if (result.success) {
          await siteSettingsStore.fetchSettings(true).catch(() => {});
        }
        return result;
      }
    } catch {
      // Fallback to direct mutation
    }

    // Direct fallback if RPC is not available in Supabase
    try {
      const { data: currentCommerce } = await client
        .from('site_settings')
        .select('value')
        .eq('key', 'commerce')
        .single();
      const currentVal = (currentCommerce?.value as Record<string, unknown>) || {};
      const { error: upsertError } = await client
        .from('site_settings')
        .upsert(
          {
            key: 'commerce',
            value: { ...currentVal, checkout_enabled: enabled },
            is_public: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );
      if (upsertError) {
        return { success: false, error: upsertError.message };
      }
      await siteSettingsStore.fetchSettings(true).catch(() => {});
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ödeme ayarı güncellenemedi';
      return { success: false, error: msg };
    }
  },
};

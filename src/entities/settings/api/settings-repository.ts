import { supabase, isSupabaseConfigured, isStorefrontMockEnabled } from '@/shared/lib/supabase';
import {
  PublicSiteSettings,
  DEFAULT_PUBLIC_SITE_SETTINGS,
  GeneralSettings,
  ContactSettings,
  CommerceSettings,
  SocialSettings,
  SellerLegalSettings,
  DEFAULT_SELLER_LEGAL,
} from '../types';

interface SiteSettingRow {
  key: string;
  value: Record<string, unknown>;
  updated_at?: string;
}

export const settingsRepository = {
  async getPublicSiteSettings(): Promise<PublicSiteSettings> {
    if (isStorefrontMockEnabled) {
      return DEFAULT_PUBLIC_SITE_SETTINGS;
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error(
        'Supabase client is not configured. Live mode requires valid Supabase environment variables.'
      );
    }

    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['general', 'contact', 'commerce', 'social']);

    if (error) {
      console.error('[settingsRepository.getPublicSiteSettings] Supabase error:', error.message);
      throw new Error(`Canlı site ayarları veritabanından alınamadı: ${error.message}`);
    }

    const rows = (data || []) as SiteSettingRow[];
    const generalRow = rows.find((r) => r.key === 'general')?.value;
    const contactRow = rows.find((r) => r.key === 'contact')?.value;
    const commerceRow = rows.find((r) => r.key === 'commerce')?.value;
    const socialRow = rows.find((r) => r.key === 'social')?.value;

    if (!generalRow || !contactRow || !commerceRow || !socialRow) {
      const missingKeys = [
        !generalRow && 'general',
        !contactRow && 'contact',
        !commerceRow && 'commerce',
        !socialRow && 'social',
      ].filter(Boolean);
      throw new Error(
        `Canlı modda gerekli site ayarları veritabanında bulunamadı (${missingKeys.join(', ')}). Lütfen tohum verilerini yükleyin veya yönetici panelinden ayarları kaydedin.`
      );
    }

    const general: GeneralSettings = {
      brandName: String(generalRow.brand_name || ''),
      tagline: String(generalRow.tagline || ''),
      description: String(generalRow.description || ''),
    };

    const contact: ContactSettings = {
      email: String(contactRow.email || ''),
      wholesaleEmail: String(contactRow.wholesale_email || ''),
      phone: String(contactRow.phone || ''),
      address: String(contactRow.address || ''),
      businessHours: String(contactRow.business_hours || ''),
    };

    const commerce: CommerceSettings = {
      freeShippingThreshold: Number(commerceRow.free_shipping_threshold) || 0,
      shippingEstimateText: String(commerceRow.shipping_estimate_text || ''),
      shippingSummary: String(commerceRow.shipping_summary || ''),
      returnsPolicyText: String(commerceRow.returns_policy_text || ''),
      checkoutEnabled: Boolean(commerceRow.checkout_enabled ?? false),
    };

    const social: SocialSettings = {
      instagram: String(socialRow.instagram || ''),
      facebook: String(socialRow.facebook || ''),
      pinterest: String(socialRow.pinterest || ''),
    };

    return {
      general,
      contact,
      commerce,
      social,
    };
  },

  async getPublicSettings(): Promise<PublicSiteSettings> {
    return this.getPublicSiteSettings();
  },

  async getSellerLegal(): Promise<SellerLegalSettings> {
    if (isStorefrontMockEnabled || !isSupabaseConfigured || !supabase) {
      return { ...DEFAULT_SELLER_LEGAL };
    }

    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'seller_legal')
        .single();

      if (error || !data) {
        return { ...DEFAULT_SELLER_LEGAL };
      }

      const v = (data.value as Record<string, unknown>) || {};
      return {
        business_type: String(v['business_type'] || ''),
        owner_full_name: String(v['owner_full_name'] || ''),
        legal_trade_title: String(v['legal_trade_title'] || ''),
        brand_name: (v['brand_name'] as string | null) ?? null,
        tax_office: String(v['tax_office'] || ''),
        tax_number: String(v['tax_number'] || ''),
        registered_address: String(v['registered_address'] || ''),
        kep_address: String(v['kep_address'] || ''),
        business_email: String(v['business_email'] || ''),
        business_phone: String(v['business_phone'] || ''),
        chamber_name: (v['chamber_name'] as string | null) ?? null,
        chamber_registration_number: (v['chamber_registration_number'] as string | null) ?? null,
        trade_registry_number: (v['trade_registry_number'] as string | null) ?? null,
        mersis_number: (v['mersis_number'] as string | null) ?? null,
      };
    } catch {
      return { ...DEFAULT_SELLER_LEGAL };
    }
  },
};

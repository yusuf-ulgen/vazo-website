import { supabase, isSupabaseConfigured, isStorefrontMockEnabled } from '@/shared/lib/supabase';
import {
  PublicSiteSettings,
  DEFAULT_PUBLIC_SITE_SETTINGS,
  GeneralSettings,
  ContactSettings,
  CommerceSettings,
  SocialSettings,
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
};

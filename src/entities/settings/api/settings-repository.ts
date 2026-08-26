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
      throw new Error(`Failed to fetch site settings from Supabase: ${error.message}`);
    }

    const rows = (data || []) as SiteSettingRow[];
    const generalRow = rows.find((r) => r.key === 'general')?.value || {};
    const contactRow = rows.find((r) => r.key === 'contact')?.value || {};
    const commerceRow = rows.find((r) => r.key === 'commerce')?.value || {};
    const socialRow = rows.find((r) => r.key === 'social')?.value || {};

    const general: GeneralSettings = {
      brandName: (generalRow.brand_name as string) || DEFAULT_PUBLIC_SITE_SETTINGS.general.brandName,
      tagline: (generalRow.tagline as string) || DEFAULT_PUBLIC_SITE_SETTINGS.general.tagline,
      description: (generalRow.description as string) || DEFAULT_PUBLIC_SITE_SETTINGS.general.description,
    };

    const contact: ContactSettings = {
      email: (contactRow.email as string) || DEFAULT_PUBLIC_SITE_SETTINGS.contact.email,
      wholesaleEmail: (contactRow.wholesale_email as string) || DEFAULT_PUBLIC_SITE_SETTINGS.contact.wholesaleEmail,
      phone: (contactRow.phone as string) || DEFAULT_PUBLIC_SITE_SETTINGS.contact.phone,
      address: (contactRow.address as string) || DEFAULT_PUBLIC_SITE_SETTINGS.contact.address,
      businessHours: (contactRow.business_hours as string) || DEFAULT_PUBLIC_SITE_SETTINGS.contact.businessHours,
    };

    const commerce: CommerceSettings = {
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
    };

    const social: SocialSettings = {
      instagram: (socialRow.instagram as string) || DEFAULT_PUBLIC_SITE_SETTINGS.social.instagram,
      facebook: (socialRow.facebook as string) || DEFAULT_PUBLIC_SITE_SETTINGS.social.facebook,
      pinterest: (socialRow.pinterest as string) || DEFAULT_PUBLIC_SITE_SETTINGS.social.pinterest,
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

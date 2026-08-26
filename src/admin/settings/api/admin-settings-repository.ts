import { requireAdminSupabase } from '@/admin/shared/api/require-admin-supabase';
import {
  PublicSiteSettings,
  DEFAULT_PUBLIC_SITE_SETTINGS,
  GeneralSettings,
  ContactSettings,
  CommerceSettings,
  SocialSettings,
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

    const payload = {
      free_shipping_threshold: Number(data.freeShippingThreshold) || 0,
      shipping_estimate_text: data.shippingEstimateText.trim(),
      shipping_summary: data.shippingSummary.trim(),
      returns_policy_text: data.returnsPolicyText.trim(),
    };

    const { error } = await client
      .from('site_settings')
      .upsert(
        { key: 'commerce', value: payload, is_public: true, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) {
      console.error('[adminSettingsRepository.updateCommerceSettings] Error:', error.message);
      throw new Error(`E-Ticaret ayarları kaydedilemedi: ${error.message}`);
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
};

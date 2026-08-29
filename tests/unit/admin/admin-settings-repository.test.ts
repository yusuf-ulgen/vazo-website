import { describe, it, expect, beforeEach, vi } from 'vitest';
import { adminSettingsRepository } from '@/admin/settings/api/admin-settings-repository';

describe('adminSettingsRepository (Phase 2.9)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches all public site settings with typed structure', async () => {
    const settings = await adminSettingsRepository.getSettings();

    expect(settings).toBeDefined();
    expect(settings.general).toBeDefined();
    expect(settings.general.brandName).toBeDefined();
    expect(settings.contact).toBeDefined();
    expect(settings.contact.email).toBeDefined();
    expect(settings.commerce).toBeDefined();
    expect(typeof settings.commerce.freeShippingThreshold).toBe('number');
    expect(settings.social).toBeDefined();
  });

  it('updates general brand settings', async () => {
    await adminSettingsRepository.updateGeneralSettings({
      brandName: 'Vazo Atelier',
      tagline: 'Modern Seramik Sanatı',
      description: 'Zanaat ve çağdaş heykel formları.',
    });

    const settings = await adminSettingsRepository.getSettings();
    expect(settings.general.brandName).toBe('Vazo Atelier');
    expect(settings.general.tagline).toBe('Modern Seramik Sanatı');
    expect(settings.general.description).toBe('Zanaat ve çağdaş heykel formları.');
  });

  it('updates contact and showroom settings', async () => {
    await adminSettingsRepository.updateContactSettings({
      email: 'destek@vazoatelier.com',
      wholesaleEmail: 'kurumsal@vazoatelier.com',
      phone: '+90 (212) 999 8877',
      address: 'Galata Tasarım Caddesi No:42, Beyoğlu, İstanbul',
      businessHours: 'Hafta içi: 09:00 – 18:00',
    });

    const settings = await adminSettingsRepository.getSettings();
    expect(settings.contact.email).toBe('destek@vazoatelier.com');
    expect(settings.contact.wholesaleEmail).toBe('kurumsal@vazoatelier.com');
    expect(settings.contact.phone).toBe('+90 (212) 999 8877');
    expect(settings.contact.address).toContain('Galata');
  });

  it('updates commerce and shipping parameters', async () => {
    await adminSettingsRepository.updateCommerceSettings({
      freeShippingThreshold: 7500,
      shippingEstimateText: 'Sepet adımında hesaplanacaktır',
      shippingSummary: 'Özel Straforlu Ahşap Sandıklı Kargo',
      returnsPolicyText: '30 gün koşulsuz iade hakkı',
    });

    const settings = await adminSettingsRepository.getSettings();
    expect(settings.commerce.freeShippingThreshold).toBe(7500);
    expect(settings.commerce.shippingSummary).toContain('Ahşap Sandıklı');
  });

  it('updates social media URLs', async () => {
    await adminSettingsRepository.updateSocialSettings({
      instagram: 'https://instagram.com/vazoatelier',
      facebook: 'https://facebook.com/vazoatelier',
      pinterest: 'https://pinterest.com/vazoatelier',
    });

    const settings = await adminSettingsRepository.getSettings();
    expect(settings.social.instagram).toBe('https://instagram.com/vazoatelier');
    expect(settings.social.facebook).toBe('https://facebook.com/vazoatelier');
    expect(settings.social.pinterest).toBe('https://pinterest.com/vazoatelier');
  });

  it('gets and updates seller legal identity', async () => {
    await adminSettingsRepository.updateSellerLegal({
      business_type: 'Şahıs Şirketi / Gerçek Kişi Tacir',
      owner_full_name: 'Yusuf Ülgen',
      legal_trade_title: 'Yusuf Ülgen Monocactus',
      brand_name: 'Monocactus',
      tax_office: 'Beyoğlu',
      tax_number: '1234567890',
      registered_address: 'Karaköy, İstanbul',
      kep_address: 'yusuf@hs01.kep.tr',
      business_email: 'info@monocactus.com',
      business_phone: '+90 212 555 0192',
      chamber_name: 'İTO',
      chamber_registration_number: '123',
      trade_registry_number: '456',
      mersis_number: null,
    });

    const legal = await adminSettingsRepository.getSellerLegal();
    expect(legal.legal_trade_title).toBe('Yusuf Ülgen Monocactus');
    expect(legal.tax_number).toBe('1234567890');
    expect(legal.mersis_number).toBeNull();
  });
});

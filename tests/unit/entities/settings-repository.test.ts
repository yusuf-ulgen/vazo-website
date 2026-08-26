import { describe, it, expect, beforeEach, vi } from 'vitest';
import { settingsRepository } from '@/entities/settings/api/settings-repository';
import { siteSettingsStore } from '@/shared/stores/settings-store';

describe('settingsRepository & siteSettingsStore (Phase 2.9)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches public site settings via repository', async () => {
    const settings = await settingsRepository.getPublicSettings();

    expect(settings).toBeDefined();
    expect(settings.general.brandName).toBeDefined();
    expect(settings.contact.email).toBeDefined();
    expect(settings.commerce.freeShippingThreshold).toBeGreaterThan(0);
    expect(settings.social).toBeDefined();
  });

  it('siteSettingsStore provides reactive state and listener notifications', async () => {
    let notifiedValue = '';
    const unsubscribe = siteSettingsStore.subscribe((s) => {
      notifiedValue = s.general.brandName;
    });

    const current = siteSettingsStore.getSettings();
    siteSettingsStore.setSettings({
      ...current,
      general: {
        ...current.general,
        brandName: 'Test Brand Name',
      },
    });

    expect(notifiedValue).toBe('Test Brand Name');
    expect(siteSettingsStore.getSettings().general.brandName).toBe('Test Brand Name');

    unsubscribe();
  });
});

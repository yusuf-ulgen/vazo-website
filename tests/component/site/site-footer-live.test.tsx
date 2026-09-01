import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SiteFooter } from '@/site/components/SiteFooter';
import { siteSettingsStore } from '@/shared/stores/settings-store';
import { DEFAULT_PUBLIC_SITE_SETTINGS } from '@/entities/settings/types';

describe('SiteFooter Live Integration (Phase 2.9)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <SiteFooter />
      </MemoryRouter>
    );

  it('renders site footer with settings from store', async () => {
    siteSettingsStore.setSettings({
      ...DEFAULT_PUBLIC_SITE_SETTINGS,
      general: {
        ...DEFAULT_PUBLIC_SITE_SETTINGS.general,
        brandName: 'VAZO STUDIO DYNAMIC',
      },
      contact: {
        ...DEFAULT_PUBLIC_SITE_SETTINGS.contact,
        email: 'iletisim@vazostudio.com',
        phone: '+90 (212) 555 9999',
      },
    });

    renderComponent();

    expect(screen.getByText(/VAZO STUDIO DYNAMIC/)).toBeInTheDocument();
    expect(screen.getByText(/iletisim@vazostudio.com/)).toBeInTheDocument();
    expect(screen.getByText(/555 9999/)).toBeInTheDocument();
  });
});

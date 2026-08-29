import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { SellerInformationPage } from '@/site/pages/SellerInformationPage';
import { renderWithRouter } from 'tests/utils/render-utils';
import { settingsRepository } from '@/entities/settings/api/settings-repository';
import { DEFAULT_PUBLIC_SITE_SETTINGS } from '@/entities/settings/types';

describe('SellerInformationPage Branch Coverage (Phase 3.10)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders MERSIS number, chamber registration, and trade registry when provided', async () => {
    vi.spyOn(settingsRepository, 'getSellerLegal').mockResolvedValue({
      business_type: 'Limited Şirket (Ltd. Şti.)',
      owner_full_name: 'Yusuf Ülgen',
      legal_trade_title: 'Monocactus Seramik Tasarım Ltd. Şti.',
      brand_name: 'Monocactus Studio',
      tax_office: 'Beyoğlu',
      tax_number: '1234567890',
      registered_address: 'Karaköy Kemankeş Cad. No:42, İstanbul',
      kep_address: 'monocactus@hs01.kep.tr',
      business_email: 'info@monocactus.com',
      business_phone: '+90 212 555 0192',
      chamber_name: 'İstanbul Ticaret Odası',
      chamber_registration_number: 'CH-9988',
      trade_registry_number: 'TR-112233',
      mersis_number: '0123456789000001',
    });

    vi.spyOn(settingsRepository, 'getPublicSiteSettings').mockResolvedValue(DEFAULT_PUBLIC_SITE_SETTINGS);

    renderWithRouter(<SellerInformationPage />);

    expect(await screen.findByText('Monocactus Seramik Tasarım Ltd. Şti.')).toBeInTheDocument();
    expect(screen.getByText('0123456789000001')).toBeInTheDocument();
    expect(screen.getByText('TR-112233')).toBeInTheDocument();
    expect(screen.getByText(/CH-9988/)).toBeInTheDocument();
  });
});

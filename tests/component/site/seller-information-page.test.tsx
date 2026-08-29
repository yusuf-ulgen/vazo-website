import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { SellerInformationPage } from '@/site/pages/SellerInformationPage';
import { renderWithRouter } from 'tests/utils/render-utils';
import { settingsRepository } from '@/entities/settings/api/settings-repository';
import { DEFAULT_SELLER_LEGAL, DEFAULT_PUBLIC_SITE_SETTINGS } from '@/entities/settings/types';

describe('SellerInformationPage Component (Phase 3.10)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially and then renders full seller legal profile', async () => {
    vi.spyOn(settingsRepository, 'getSellerLegal').mockResolvedValue({
      business_type: 'Şahıs Şirketi / Gerçek Kişi Tacir',
      owner_full_name: 'Yusuf Ülgen',
      legal_trade_title: 'Yusuf Ülgen Monocactus Tasarım Atölyesi',
      brand_name: 'Monocactus',
      tax_office: 'Beyoğlu Vergi Dairesi',
      tax_number: '1234567890',
      registered_address: 'Karaköy Kemankeş Cad. No:42, Beyoğlu / İstanbul',
      kep_address: 'yusuf.ulgen@hs01.kep.tr',
      business_email: 'info@monocactus.com',
      business_phone: '+90 (212) 555 0192',
      chamber_name: 'İstanbul Ticaret Odası',
      chamber_registration_number: '123456',
      trade_registry_number: '987654',
      mersis_number: null, // Sole proprietor optional
    });

    vi.spyOn(settingsRepository, 'getPublicSiteSettings').mockResolvedValue(DEFAULT_PUBLIC_SITE_SETTINGS);

    renderWithRouter(<SellerInformationPage />);

    // Header & breadcrumbs
    expect(await screen.findByText('Satıcı & Yasal Bilgiler')).toBeInTheDocument();
    expect(screen.getByText('İşletme & Tacir Kimlik Bilgileri')).toBeInTheDocument();

    // Seller fields
    expect(screen.getByText('Yusuf Ülgen Monocactus Tasarım Atölyesi')).toBeInTheDocument();
    expect(screen.getByText('Yusuf Ülgen')).toBeInTheDocument();
    expect(screen.getByText('Beyoğlu Vergi Dairesi')).toBeInTheDocument();
    expect(screen.getByText('1234567890')).toBeInTheDocument();
    expect(screen.getByText(/Karaköy Kemankeş Cad\. No:42/)).toBeInTheDocument();
    expect(screen.getByText('yusuf.ulgen@hs01.kep.tr')).toBeInTheDocument();
    expect(screen.getByText('info@monocactus.com')).toBeInTheDocument();
    expect(screen.getByText('+90 (212) 555 0192')).toBeInTheDocument();

    // Sole proprietor MERSIS exemption disclosure
    expect(screen.getByText('Şahıs firması (MERSİS muafiyeti)')).toBeInTheDocument();

    // Chamber details
    expect(screen.getByText(/İstanbul Ticaret Odası/)).toBeInTheDocument();

    // Truthful Payment Disclosure
    expect(screen.getByText('Güvenli Ödeme Altyapısı & Kart Güvenliği')).toBeInTheDocument();
    expect(screen.getByText(/PayTR Ödeme Altyapısı/)).toBeInTheDocument();
    expect(screen.getByText(/Kart Bilgisi Saklanmaz/)).toBeInTheDocument();
    expect(screen.getByText(/Desteklenen Kartlar/)).toBeInTheDocument();

    // Policy links
    expect(screen.getByText('Gizlilik & KVKK Politikası')).toBeInTheDocument();
    expect(screen.getByText('Teslimat & İade Koşulları')).toBeInTheDocument();
    expect(screen.getByText('Mesafeli Satış Sözleşmesi')).toBeInTheDocument();
  });

  it('renders fallback gracefully when seller legal profile is empty', async () => {
    vi.spyOn(settingsRepository, 'getSellerLegal').mockResolvedValue(DEFAULT_SELLER_LEGAL);
    vi.spyOn(settingsRepository, 'getPublicSiteSettings').mockResolvedValue(DEFAULT_PUBLIC_SITE_SETTINGS);

    renderWithRouter(<SellerInformationPage />);

    await waitFor(() => {
      expect(screen.getByText('Satıcı & Yasal Bilgiler')).toBeInTheDocument();
    });

    // MERSIS shows exemption note
    expect(screen.getByText('Şahıs firması (MERSİS muafiyeti)')).toBeInTheDocument();
  });
});

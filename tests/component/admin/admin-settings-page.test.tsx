import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminSettingsPage } from '@/admin/settings/pages/AdminSettingsPage';
import { ToastProvider } from '@/admin/ui';
import { adminSettingsRepository } from '@/admin/settings/api/admin-settings-repository';
import { DEFAULT_SELLER_LEGAL } from '@/entities/settings/types';

describe('AdminSettingsPage Component (Phase 3.10)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(adminSettingsRepository, 'getSellerLegal').mockResolvedValue({
      ...DEFAULT_SELLER_LEGAL,
      business_type: 'Şahıs Şirketi / Gerçek Kişi Tacir',
      owner_full_name: 'Yusuf Ülgen',
      legal_trade_title: 'Yusuf Ülgen Monocactus Tasarım Atölyesi',
      tax_office: 'Beyoğlu',
      tax_number: '1234567890',
      registered_address: 'Karaköy Kemankeş Cad. No:42, İstanbul',
      kep_address: 'yusuf.ulgen@hs01.kep.tr',
      business_email: 'info@monocactus.com',
      business_phone: '+90 (212) 555 0192',
      mersis_number: null, // MERSIS optional for sole proprietor
    });

    vi.spyOn(adminSettingsRepository, 'getCheckoutReadiness').mockResolvedValue({
      seller_legal_complete: true,
      checkout_enabled: false,
      has_active_shipping: true,
      paytr_secrets_present: true,
      gmail_secrets_present: true,
      seller_fields_summary: {
        business_type: true,
        owner_full_name: true,
        legal_trade_title: true,
        tax_office: true,
        tax_number: true,
        registered_address: true,
        kep_address: true,
        business_email: true,
        business_phone: true,
        mersis_number: false,
      },
    });
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <ToastProvider>
          <AdminSettingsPage />
        </ToastProvider>
      </MemoryRouter>
    );

  it('renders page header and navigation tabs', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Sistem & Site Ayarları')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Genel Marka/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /İletişim & Showroom/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Kargo & E-Ticaret/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sosyal Medya/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Satıcı \/ Yasal Bilgiler/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Entegrasyon Hazırlığı/i })).toBeInTheDocument();
    });

    // Default tab is General
    expect(screen.getByText('Genel Marka Kimliği')).toBeInTheDocument();
    expect(screen.getByLabelText(/Marka Adı/i)).toBeInTheDocument();
  });

  it('saves general settings successfully', async () => {
    const updateSpy = vi.spyOn(adminSettingsRepository, 'updateGeneralSettings');
    renderComponent();

    await waitFor(() => {
      expect(screen.getByLabelText(/Marka Adı/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Marka Adı/i), {
      target: { value: 'Monocactus Lab' },
    });

    const saveButton = screen.getByRole('button', { name: /Genel Ayarları Kaydet/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          brandName: 'Monocactus Lab',
        })
      );
    });
  });

  it('switches to contact tab and validates email format', async () => {
    const updateSpy = vi.spyOn(adminSettingsRepository, 'updateContactSettings');
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /İletişim & Showroom/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /İletişim & Showroom/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Genel Destek E-Posta/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Genel Destek E-Posta/i), {
      target: { value: 'invalid-email' },
    });

    const saveButton = screen.getByRole('button', { name: /İletişim Bilgilerini Kaydet/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Geçerli bir e-posta adresi giriniz.')).toBeInTheDocument();
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  it('switches to commerce tab and saves commerce settings', async () => {
    const updateSpy = vi.spyOn(adminSettingsRepository, 'updateCommerceSettings');
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Kargo & E-Ticaret/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Kargo & E-Ticaret/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Ücretsiz Kargo Limiti/i)).toBeInTheDocument();
    });

    const thresholdInput = screen.getByLabelText(/Ücretsiz Kargo Limiti/i);
    fireEvent.change(thresholdInput, {
      target: { value: '6000' },
    });

    const saveButton = screen.getByRole('button', { name: /Kargo Ayarlarını Kaydet/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          freeShippingThreshold: 6000,
        })
      );
    });
  });

  it('switches to Satıcı / Yasal Bilgiler tab and verifies sole proprietor MERSIS optionality', async () => {
    const updateLegalSpy = vi.spyOn(adminSettingsRepository, 'updateSellerLegal').mockResolvedValue();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Satıcı \/ Yasal Bilgiler/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Satıcı \/ Yasal Bilgiler/i }));

    await waitFor(() => {
      expect(screen.getByText('Satıcı & Yasal İşletme Bilgileri')).toBeInTheDocument();
      expect(screen.getByLabelText(/Yetkili \/ İşletme Sahibi/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Yasal Ticaret Unvanı/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/MERSİS Numarası/i)).toBeInTheDocument();
    });

    // MERSIS note clearly states optional for sole proprietor
    expect(screen.getByText(/Şahıs firmaları için MERSİS zorunlu değildir/i)).toBeInTheDocument();

    const saveButton = screen.getByRole('button', { name: /Satıcı Bilgilerini Kaydet/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateLegalSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          owner_full_name: 'Yusuf Ülgen',
          legal_trade_title: 'Yusuf Ülgen Monocactus Tasarım Atölyesi',
          mersis_number: null,
        })
      );
    });
  });

  it('switches to Entegrasyon Hazırlığı tab and toggles checkout activation', async () => {
    const toggleSpy = vi.spyOn(adminSettingsRepository, 'setCheckoutEnabled').mockResolvedValue({
      success: true,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Entegrasyon Hazırlığı/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Entegrasyon Hazırlığı/i }));

    await waitFor(() => {
      expect(screen.getByText('Canlı Ödeme & Sipariş Altyapısı')).toBeInTheDocument();
      expect(screen.getByText('Entegrasyon & Güvenlik Hazırlık Durumu')).toBeInTheDocument();
      expect(screen.getByText('E-Fatura & E-Arşiv Entegrasyonu')).toBeInTheDocument();
      expect(screen.getByText('Gelecek Entegrasyon')).toBeInTheDocument();
    });

    const toggleButton = screen.getByRole('button', { name: /Ödemeyi Canlıya Aç/i });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(toggleSpy).toHaveBeenCalledWith(true);
    });
  });

  it('switches to Sosyal Medya tab and saves social links', async () => {
    const updateSpy = vi.spyOn(adminSettingsRepository, 'updateSocialSettings').mockResolvedValue();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Sosyal Medya/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Sosyal Medya/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Instagram URL/i)).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /Sosyal Medyayı Kaydet/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalled();
    });
  });
});

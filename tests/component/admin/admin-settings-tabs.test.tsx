import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToastProvider } from '@/admin/ui';
import { AdminGeneralSettingsTab } from '@/admin/settings/components/AdminGeneralSettingsTab';
import { AdminContactSettingsTab } from '@/admin/settings/components/AdminContactSettingsTab';
import { AdminCommerceSettingsTab } from '@/admin/settings/components/AdminCommerceSettingsTab';
import { AdminSocialSettingsTab } from '@/admin/settings/components/AdminSocialSettingsTab';
import { AdminSellerLegalTab } from '@/admin/settings/components/AdminSellerLegalTab';
import { AdminReadinessTab } from '@/admin/settings/components/AdminReadinessTab';
import { adminSettingsRepository } from '@/admin/settings/api/admin-settings-repository';
import { DEFAULT_SELLER_LEGAL } from '@/entities/settings/types';

describe('Admin Settings Tab Components (Phase 3.10)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AdminGeneralSettingsTab', () => {
    it('validates empty inputs and submits valid data', async () => {
      const updateSpy = vi.spyOn(adminSettingsRepository, 'updateGeneralSettings').mockResolvedValue();
      const onSaved = vi.fn();

      render(
        <ToastProvider>
          <AdminGeneralSettingsTab
            initialData={{ brandName: '', tagline: '', description: '' }}
            onSaved={onSaved}
          />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: /Genel Ayarları Kaydet/i }));
      expect(screen.getByText('Marka adı zorunludur.')).toBeInTheDocument();
      expect(screen.getByText('Slogan zorunludur.')).toBeInTheDocument();
      expect(updateSpy).not.toHaveBeenCalled();

      fireEvent.change(screen.getByLabelText(/Marka Adı/i), { target: { value: 'Monocactus' } });
      fireEvent.change(screen.getByLabelText(/Slogan/i), { target: { value: 'Seramik Atölyesi' } });
      fireEvent.change(screen.getByLabelText(/Site Açıklaması/i), { target: { value: 'Özgün seramikler.' } });

      fireEvent.click(screen.getByRole('button', { name: /Genel Ayarları Kaydet/i }));

      await waitFor(() => {
        expect(updateSpy).toHaveBeenCalledWith({
          brandName: 'Monocactus',
          tagline: 'Seramik Atölyesi',
          description: 'Özgün seramikler.',
        });
        expect(onSaved).toHaveBeenCalled();
      });
    });

    it('handles repository error gracefully', async () => {
      vi.spyOn(adminSettingsRepository, 'updateGeneralSettings').mockRejectedValue(new Error('Kayıt başarısız'));

      render(
        <ToastProvider>
          <AdminGeneralSettingsTab
            initialData={{ brandName: 'Test', tagline: 'Slogan', description: 'Desc' }}
          />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: /Genel Ayarları Kaydet/i }));
      await waitFor(() => {
        expect(screen.getByText('Kayıt başarısız')).toBeInTheDocument();
      });
    });
  });

  describe('AdminContactSettingsTab', () => {
    it('validates contact fields and handles error branches', async () => {
      const updateSpy = vi.spyOn(adminSettingsRepository, 'updateContactSettings').mockResolvedValue();
      const onSaved = vi.fn();

      render(
        <ToastProvider>
          <AdminContactSettingsTab
            initialData={{ email: '', wholesaleEmail: '', phone: '', address: '', businessHours: '' }}
            onSaved={onSaved}
          />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: /İletişim Bilgilerini Kaydet/i }));
      expect(screen.getByText('Geçerli bir e-posta adresi giriniz.')).toBeInTheDocument();
      expect(screen.getByText('Geçerli bir toptan e-posta adresi giriniz.')).toBeInTheDocument();
      expect(screen.getByText('Telefon numarası zorunludur.')).toBeInTheDocument();
      expect(screen.getByText('Showroom adresi zorunludur.')).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/Genel Destek E-Posta/i), { target: { value: 'info@monocactus.com' } });
      fireEvent.change(screen.getByLabelText(/Toptan \/ Trade E-Posta/i), { target: { value: 'trade@monocactus.com' } });
      fireEvent.change(screen.getByLabelText(/Telefon/i), { target: { value: '+90 555 1234567' } });
      fireEvent.change(screen.getByLabelText(/Çalışma Saatleri/i), { target: { value: '10:00 - 19:00' } });
      fireEvent.change(screen.getByLabelText(/Showroom & Atölye Adresi/i), { target: { value: 'Karaköy, İstanbul' } });

      fireEvent.click(screen.getByRole('button', { name: /İletişim Bilgilerini Kaydet/i }));

      await waitFor(() => {
        expect(updateSpy).toHaveBeenCalledWith({
          email: 'info@monocactus.com',
          wholesaleEmail: 'trade@monocactus.com',
          phone: '+90 555 1234567',
          businessHours: '10:00 - 19:00',
          address: 'Karaköy, İstanbul',
        });
        expect(onSaved).toHaveBeenCalled();
      });
    });

    it('handles contact repository rejection', async () => {
      vi.spyOn(adminSettingsRepository, 'updateContactSettings').mockRejectedValue(new Error('İletişim hatası'));

      render(
        <ToastProvider>
          <AdminContactSettingsTab
            initialData={{
              email: 'info@monocactus.com',
              wholesaleEmail: 'trade@monocactus.com',
              phone: '5551234567',
              address: 'Adres',
              businessHours: '09:00 - 18:00',
            }}
          />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: /İletişim Bilgilerini Kaydet/i }));
      await waitFor(() => {
        expect(screen.getByText('İletişim hatası')).toBeInTheDocument();
      });
    });
  });

  describe('AdminCommerceSettingsTab', () => {
    it('validates commerce threshold and shipping text', async () => {
      const updateSpy = vi.spyOn(adminSettingsRepository, 'updateCommerceSettings').mockResolvedValue();

      render(
        <ToastProvider>
          <AdminCommerceSettingsTab
            initialData={{
              freeShippingThreshold: -10,
              shippingEstimateText: '',
              shippingSummary: '',
              returnsPolicyText: '',
              checkoutEnabled: false,
            }}
          />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: /Kargo Ayarlarını Kaydet/i }));
      expect(screen.getByText('Ücretsiz kargo limiti 0 veya daha büyük olmalıdır.')).toBeInTheDocument();
      expect(screen.getByText('Kargo bilgilendirme metni zorunludur.')).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/Ücretsiz Kargo Limiti/i), { target: { value: '3000' } });
      fireEvent.change(screen.getByLabelText(/Kargo Hesaplama Notu/i), { target: { value: 'Ödeme adımında' } });
      fireEvent.change(screen.getByLabelText(/Kargo & Güvenlik Özeti/i), { target: { value: 'Sigortalı kargo' } });
      fireEvent.change(screen.getByLabelText(/İade Koşulu Özeti/i), { target: { value: '14 gün iade' } });

      fireEvent.click(screen.getByRole('button', { name: /Kargo Ayarlarını Kaydet/i }));

      await waitFor(() => {
        expect(updateSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            freeShippingThreshold: 3000,
            shippingEstimateText: 'Ödeme adımında',
          })
        );
      });
    });

    it('handles commerce update error', async () => {
      vi.spyOn(adminSettingsRepository, 'updateCommerceSettings').mockRejectedValue(new Error('Kargo güncellenemedi'));

      render(
        <ToastProvider>
          <AdminCommerceSettingsTab
            initialData={{
              freeShippingThreshold: 1000,
              shippingEstimateText: 'Tahmini kargo',
              shippingSummary: 'Özet',
              returnsPolicyText: 'İade',
              checkoutEnabled: false,
            }}
          />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: /Kargo Ayarlarını Kaydet/i }));
      await waitFor(() => {
        expect(screen.getByText('Kargo güncellenemedi')).toBeInTheDocument();
      });
    });
  });

  describe('AdminSocialSettingsTab', () => {
    it('validates social URLs and submits', async () => {
      const updateSpy = vi.spyOn(adminSettingsRepository, 'updateSocialSettings').mockResolvedValue();

      render(
        <ToastProvider>
          <AdminSocialSettingsTab
            initialData={{ instagram: 'invalid-url', facebook: 'invalid-fb', pinterest: 'invalid-pin' }}
          />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: /Sosyal Medyayı Kaydet/i }));
      expect(screen.getAllByText(/Geçerli bir URL giriniz/i).length).toBe(3);
      expect(updateSpy).not.toHaveBeenCalled();

      fireEvent.change(screen.getByLabelText(/Instagram URL/i), { target: { value: 'https://instagram.com/monocactus' } });
      fireEvent.change(screen.getByLabelText(/Facebook URL/i), { target: { value: 'https://facebook.com/monocactus' } });
      fireEvent.change(screen.getByLabelText(/Pinterest URL/i), { target: { value: 'https://pinterest.com/monocactus' } });

      fireEvent.click(screen.getByRole('button', { name: /Sosyal Medyayı Kaydet/i }));

      await waitFor(() => {
        expect(updateSpy).toHaveBeenCalledWith({
          instagram: 'https://instagram.com/monocactus',
          facebook: 'https://facebook.com/monocactus',
          pinterest: 'https://pinterest.com/monocactus',
        });
      });
    });

    it('handles social error rejection', async () => {
      vi.spyOn(adminSettingsRepository, 'updateSocialSettings').mockRejectedValue(new Error('Sosyal ayar hatası'));

      render(
        <ToastProvider>
          <AdminSocialSettingsTab
            initialData={{ instagram: 'https://instagram.com/mono', facebook: '', pinterest: '' }}
          />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: /Sosyal Medyayı Kaydet/i }));
      await waitFor(() => {
        expect(screen.getByText('Sosyal ayar hatası')).toBeInTheDocument();
      });
    });
  });

  describe('AdminSellerLegalTab', () => {
    it('validates all required legal fields and tax number digit length', async () => {
      const updateSpy = vi.spyOn(adminSettingsRepository, 'updateSellerLegal').mockResolvedValue();

      render(
        <ToastProvider>
          <AdminSellerLegalTab initialData={DEFAULT_SELLER_LEGAL} />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: /Satıcı Bilgilerini Kaydet/i }));

      expect(screen.getByText('İşletme türü seçilmelidir.')).toBeInTheDocument();
      expect(screen.getByText('İşletme sahibi / yetkili ad soyad zorunludur.')).toBeInTheDocument();
      expect(screen.getByText('Yasal ticaret unvanı zorunludur.')).toBeInTheDocument();
      expect(screen.getByText('Bağlı olunan vergi dairesi zorunludur.')).toBeInTheDocument();
      expect(screen.getByText(/Vergi kimlik numarası veya T\.C\. Kimlik No zorunludur/i)).toBeInTheDocument();
      expect(screen.getByText(/Yasal tebligat \/ kayıtlı iş yeri adresi zorunludur/i)).toBeInTheDocument();
      expect(screen.getByText('Resmi ticari e-posta adresi zorunludur.')).toBeInTheDocument();
      expect(screen.getByText('Ticari telefon numarası zorunludur.')).toBeInTheDocument();
      expect(screen.getByText(/Kayıtlı Elektronik Posta \(KEP\) adresi zorunludur/i)).toBeInTheDocument();

      // Test invalid tax number format
      fireEvent.change(screen.getByLabelText(/Vergi Kimlik No/i), { target: { value: '123' } });
      fireEvent.click(screen.getByRole('button', { name: /Satıcı Bilgilerini Kaydet/i }));
      expect(screen.getByText('Vergi No 10 haneli, TCKN 11 haneli rakamdan oluşmalıdır.')).toBeInTheDocument();

      // Test invalid email format
      fireEvent.change(screen.getByLabelText(/Resmi Ticari E-Posta/i), { target: { value: 'invalid-email' } });
      fireEvent.click(screen.getByRole('button', { name: /Satıcı Bilgilerini Kaydet/i }));
      expect(screen.getByText('Geçerli bir e-posta formatı giriniz.')).toBeInTheDocument();

      // Fill valid fields
      fireEvent.change(screen.getByLabelText(/İşletme Türü/i), { target: { value: 'Şahıs Şirketi / Gerçek Kişi Tacir' } });
      fireEvent.change(screen.getByLabelText(/Yetkili \/ İşletme Sahibi/i), { target: { value: 'Yusuf Ülgen' } });
      fireEvent.change(screen.getByLabelText(/Yasal Ticaret Unvanı/i), { target: { value: 'Yusuf Ülgen Monocactus' } });
      fireEvent.change(screen.getByLabelText(/Marka \/ İşletme Adı/i), { target: { value: 'Monocactus' } });
      fireEvent.change(screen.getByLabelText(/Bağlı Olunan Vergi Dairesi/i), { target: { value: 'Beyoğlu' } });
      fireEvent.change(screen.getByLabelText(/Vergi Kimlik No/i), { target: { value: '1234567890' } });
      fireEvent.change(screen.getByLabelText(/Kayıtlı Tebligat/i), { target: { value: 'Karaköy, İstanbul' } });
      fireEvent.change(screen.getByLabelText(/KEP Adresi/i), { target: { value: 'yusuf@hs01.kep.tr' } });
      fireEvent.change(screen.getByLabelText(/Resmi Ticari E-Posta/i), { target: { value: 'info@monocactus.com' } });
      fireEvent.change(screen.getByLabelText(/Resmi Ticari Telefon/i), { target: { value: '+90 555 1234567' } });
      fireEvent.change(screen.getByLabelText(/Kayıtlı Olunan Meslek Odası/i), { target: { value: 'İTO' } });
      fireEvent.change(screen.getByLabelText(/Oda Sicil Numarası/i), { target: { value: '12345' } });
      fireEvent.change(screen.getByLabelText(/Ticaret Sicil Numarası/i), { target: { value: '67890' } });
      fireEvent.change(screen.getByLabelText(/MERSİS Numarası/i), { target: { value: '' } });

      // Clear optional fields to test null branches
      fireEvent.change(screen.getByLabelText(/Marka \/ İşletme Adı/i), { target: { value: '   ' } });
      fireEvent.change(screen.getByLabelText(/Kayıtlı Olunan Meslek Odası/i), { target: { value: '   ' } });
      fireEvent.change(screen.getByLabelText(/Oda Sicil Numarası/i), { target: { value: '   ' } });
      fireEvent.change(screen.getByLabelText(/Ticaret Sicil Numarası/i), { target: { value: '   ' } });

      fireEvent.click(screen.getByRole('button', { name: /Satıcı Bilgilerini Kaydet/i }));

      await waitFor(() => {
        expect(updateSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            business_type: 'Şahıs Şirketi / Gerçek Kişi Tacir',
            owner_full_name: 'Yusuf Ülgen',
            legal_trade_title: 'Yusuf Ülgen Monocactus',
            tax_number: '1234567890',
            brand_name: null,
            chamber_name: null,
            chamber_registration_number: null,
            trade_registry_number: null,
            mersis_number: null,
          })
        );
      });
    });

    it('handles seller legal update error rejection', async () => {
      vi.spyOn(adminSettingsRepository, 'updateSellerLegal').mockRejectedValue(new Error('Yasal veritabanı hatası'));

      render(
        <ToastProvider>
          <AdminSellerLegalTab
            initialData={{
              business_type: 'Şahıs Şirketi',
              owner_full_name: 'Yusuf Ülgen',
              legal_trade_title: 'Yusuf Ülgen',
              brand_name: null,
              tax_office: 'Beyoğlu',
              tax_number: '1234567890',
              registered_address: 'Adres',
              kep_address: 'yusuf@hs01.kep.tr',
              business_email: 'info@monocactus.com',
              business_phone: '5551234567',
              chamber_name: null,
              chamber_registration_number: null,
              trade_registry_number: null,
              mersis_number: null,
            }}
          />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: /Satıcı Bilgilerini Kaydet/i }));
      await waitFor(() => {
        expect(screen.getByText('Yasal veritabanı hatası')).toBeInTheDocument();
      });
    });
  });

  describe('AdminReadinessTab', () => {
    it('handles toggle failure when activation conditions are not met', async () => {
      vi.spyOn(adminSettingsRepository, 'getCheckoutReadiness').mockResolvedValue({
        seller_legal_complete: false,
        checkout_enabled: false,
        has_active_shipping: false,
        paytr_secrets_present: false,
        gmail_secrets_present: false,
        seller_fields_summary: {},
      });

      render(
        <ToastProvider>
          <AdminReadinessTab />
        </ToastProvider>
      );

      expect(await screen.findByText('Entegrasyon & Güvenlik Hazırlık Durumu')).toBeInTheDocument();
      expect(screen.getByText(/Ödeme Altyapısı KAPALI/i)).toBeInTheDocument();
      expect(screen.getByText('Eksik Bilgiler Var')).toBeInTheDocument();
      expect(screen.getByText('Aktif Tarife Yok')).toBeInTheDocument();
    });

    it('handles checkout toggle error rejection', async () => {
      vi.spyOn(adminSettingsRepository, 'getCheckoutReadiness').mockResolvedValue({
        seller_legal_complete: true,
        checkout_enabled: false,
        has_active_shipping: true,
        paytr_secrets_present: false,
        gmail_secrets_present: false,
        seller_fields_summary: {},
      });

      vi.spyOn(adminSettingsRepository, 'setCheckoutEnabled').mockResolvedValue({
        success: false,
        error: 'Aktivasyon engellendi.',
      });

      render(
        <ToastProvider>
          <AdminReadinessTab />
        </ToastProvider>
      );

      expect(await screen.findAllByText('Yapılandırılmadı')).toHaveLength(2);

      const enableBtn = await screen.findByRole('button', { name: /Ödemeyi Canlıya Aç/i });
      fireEvent.click(enableBtn);

      await waitFor(() => {
        expect(screen.getByText('Aktivasyon engellendi.')).toBeInTheDocument();
      });
    });

    it('toggles checkout off when currently enabled and handles refresh', async () => {
      vi.spyOn(adminSettingsRepository, 'getCheckoutReadiness').mockResolvedValue({
        seller_legal_complete: true,
        checkout_enabled: true,
        has_active_shipping: true,
        paytr_secrets_present: true,
        gmail_secrets_present: true,
        seller_fields_summary: {},
      });

      const toggleSpy = vi.spyOn(adminSettingsRepository, 'setCheckoutEnabled').mockResolvedValue({
        success: true,
      });

      render(
        <ToastProvider>
          <AdminReadinessTab />
        </ToastProvider>
      );

      const disableBtn = await screen.findByRole('button', { name: /Ödemeyi Kapat/i });
      fireEvent.click(disableBtn);

      await waitFor(() => {
        expect(toggleSpy).toHaveBeenCalledWith(false);
      });

      // Click refresh button
      const refreshBtn = screen.getByTitle('Yenile');
      fireEvent.click(refreshBtn);
    });

    it('handles exception thrown during toggle', async () => {
      vi.spyOn(adminSettingsRepository, 'getCheckoutReadiness').mockResolvedValue({
        seller_legal_complete: true,
        checkout_enabled: false,
        has_active_shipping: true,
        paytr_secrets_present: true,
        gmail_secrets_present: true,
        seller_fields_summary: {},
      });

      vi.spyOn(adminSettingsRepository, 'setCheckoutEnabled').mockRejectedValue(new Error('Sunucu zaman aşımı'));

      render(
        <ToastProvider>
          <AdminReadinessTab />
        </ToastProvider>
      );

      const enableBtn = await screen.findByRole('button', { name: /Ödemeyi Canlıya Aç/i });
      fireEvent.click(enableBtn);

      await waitFor(() => {
        expect(screen.getByText('Sunucu zaman aşımı')).toBeInTheDocument();
      });
    });
  });
});

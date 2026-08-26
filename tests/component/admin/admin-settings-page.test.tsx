import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminSettingsPage } from '@/admin/settings/pages/AdminSettingsPage';
import { ToastProvider } from '@/admin/ui';
import { adminSettingsRepository } from '@/admin/settings/api/admin-settings-repository';

describe('AdminSettingsPage Component (Phase 2.9)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <ToastProvider>
          <AdminSettingsPage />
        </ToastProvider>
      </MemoryRouter>
    );

  it('renders all 4 settings cards', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Sistem & Site Ayarları')).toBeInTheDocument();
      expect(screen.getByText('Genel Marka Kimliği')).toBeInTheDocument();
      expect(screen.getByText('İletişim & Showroom Bilgileri')).toBeInTheDocument();
      expect(screen.getByText('E-Ticaret & Kargo Parametreleri')).toBeInTheDocument();
      expect(screen.getByText('Sosyal Medya Bağlantıları')).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Marka Adı/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Genel Destek E-Posta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ücretsiz Kargo Limiti/i)).toBeInTheDocument();
  });

  it('saves general settings successfully', async () => {
    const updateSpy = vi.spyOn(adminSettingsRepository, 'updateGeneralSettings');
    renderComponent();

    await waitFor(() => {
      expect(screen.getByLabelText(/Marka Adı/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Marka Adı/i), {
      target: { value: 'Vazo Ceramic Lab' },
    });

    const saveButton = screen.getByRole('button', { name: /Genel Ayarları Kaydet/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          brandName: 'Vazo Ceramic Lab',
        })
      );
    });
  });

  it('validates contact email before saving', async () => {
    const updateSpy = vi.spyOn(adminSettingsRepository, 'updateContactSettings');
    renderComponent();

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

  it('saves commerce settings successfully', async () => {
    const updateSpy = vi.spyOn(adminSettingsRepository, 'updateCommerceSettings');
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText('Ayarlar yükleniyor...')).not.toBeInTheDocument();
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
});

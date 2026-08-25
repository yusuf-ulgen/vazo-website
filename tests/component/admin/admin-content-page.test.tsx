import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminContentPage } from '@/admin/content/pages/AdminContentPage';
import { ToastProvider } from '@/admin/ui';
import { adminContentRepository } from '@/admin/content/api/admin-content-repository';

describe('AdminContentPage Component (Phase 2.8)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <ToastProvider>
          <AdminContentPage />
        </ToastProvider>
      </MemoryRouter>
    );

  it('renders page header and hero slides tab by default', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('İçerik & Vitrin Yönetimi (CMS)')).toBeInTheDocument();
      expect(screen.getByText('Split Hero Vitrini')).toBeInTheDocument();
      expect(screen.getByText('Ticari Avantajlar (Wholesale Benefits)')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Yeni Hero Ekle/i })).toBeInTheDocument();
    expect(screen.getByText('Perakende')).toBeInTheDocument();
    expect(screen.getByText('Toptan')).toBeInTheDocument();
  });

  it('switches to wholesale benefits tab and displays benefits list', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Split Hero Vitrini')).toBeInTheDocument();
    });

    const benefitsTabBtn = screen.getByRole('button', { name: /Ticari Avantajlar/i });
    fireEvent.click(benefitsTabBtn);

    await waitFor(() => {
      expect(screen.getByText('Özel Toptan Fiyatlar')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Yeni Avantaj Ekle/i })).toBeInTheDocument();
    });
  });

  it('opens hero slide edit modal and saves changes', async () => {
    const updateSpy = vi.spyOn(adminContentRepository, 'updateHeroSlide');
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Perakende')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle('Düzenle');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: /Hero Vitrinini Düzenle/i })).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/Ana Başlık/i);
    fireEvent.change(titleInput, { target: { value: 'Yeni Sezon Perakende' } });

    const submitBtn = screen.getByRole('button', { name: /Güncelle/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          title: 'Yeni Sezon Perakende',
        })
      );
    });
  });

  it('opens benefit create modal and creates a new benefit', async () => {
    const createSpy = vi.spyOn(adminContentRepository, 'createWholesaleBenefit');
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Ticari Avantajlar/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Ticari Avantajlar/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Yeni Avantaj Ekle/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Yeni Avantaj Ekle/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: /Yeni Ticari Avantaj Ekle/i })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/^Başlık/i), { target: { value: 'Hızlı Numune Desteği' } });
    fireEvent.change(screen.getByLabelText(/^Açıklama/i), { target: { value: '48 saatte kargoya verilir.' } });

    fireEvent.click(screen.getByRole('button', { name: /Kaydet/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Hızlı Numune Desteği',
          description: '48 saatte kargoya verilir.',
        })
      );
    });
  });

  it('deletes a wholesale benefit with alertdialog confirmation', async () => {
    const deleteSpy = vi.spyOn(adminContentRepository, 'deleteWholesaleBenefit');
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Ticari Avantajlar/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Ticari Avantajlar/i }));

    await waitFor(() => {
      expect(screen.getByText('Özel Toptan Fiyatlar')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Sil');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText(/avantajını silmek istediğinizden emin misiniz/i)).toBeInTheDocument();
    });

    const alertdialog = screen.getByRole('alertdialog');
    const confirmBtn = within(alertdialog).getByRole('button', { name: 'Avantajı Sil' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalled();
    });
  });
});

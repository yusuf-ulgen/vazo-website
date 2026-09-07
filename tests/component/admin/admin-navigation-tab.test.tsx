import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminNavigationTab } from '@/admin/navigation/components/AdminNavigationTab';
import { ToastProvider } from '@/admin/ui';
import { adminNavigationRepository } from '@/admin/navigation/api/admin-navigation-repository';

describe('AdminNavigationTab Component (Phase 2.9)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <ToastProvider>
          <AdminNavigationTab />
        </ToastProvider>
      </MemoryRouter>
    );

  it('renders menu type filter pills and groups list', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Tümü' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Perakende Mega Menü' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Toptan Mega Menü' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Yeni Menü Grubu/i })).toBeInTheDocument();
      expect(screen.getByText('Kategoriler')).toBeInTheDocument();
    });
  });

  it('filters groups when clicking a menu type filter', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Kategoriler')).toBeInTheDocument();
    });

    const footerTabBtn = screen.getByRole('button', { name: 'Altbilgi (Footer)' });
    fireEvent.click(footerTabBtn);

    await waitFor(() => {
      expect(screen.getByText('Alışveriş')).toBeInTheDocument();
    });
  });

  it('opens and closes new menu group modal', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Yeni Menü Grubu/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Yeni Menü Grubu/i }));

    expect(screen.getByRole('heading', { name: 'Yeni Menü Grubu Ekle' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Grup Başlığı/i)).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: 'İptal' });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Yeni Menü Grubu Ekle' })).not.toBeInTheDocument();
    });
  });

  it('opens new menu item modal and adds an item', async () => {
    const createItemSpy = vi.spyOn(adminNavigationRepository, 'createMenuItem');
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Kategoriler')).toBeInTheDocument();
    });

    const addItemButtons = screen.getAllByRole('button', { name: /Bağlantı Ekle/i });
    fireEvent.click(addItemButtons[0]);

    expect(screen.getByRole('heading', { name: 'Yeni Menü Bağlantısı Ekle' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Bağlantı Başlığı/i), {
      target: { value: 'Özel Seri Vazolar' },
    });
    fireEvent.change(screen.getByLabelText(/Hedef Link/i), {
      target: { value: '/products?collection=special' },
    });

    const saveButton = screen.getByRole('button', { name: 'Kaydet' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(createItemSpy).toHaveBeenCalled();
    });
  });
});

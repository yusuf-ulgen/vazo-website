import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '@/admin/ui';
import { AdminPagesTab } from '@/admin/content/components/AdminPagesTab';

describe('AdminPagesTab Component', () => {
  const renderTab = () =>
    render(
      <ToastProvider>
        <AdminPagesTab />
      </ToastProvider>
    );

  it('renders pages list and allows selecting different pages', async () => {
    renderTab();

    await waitFor(() => {
      expect(screen.getAllByText('Hakkımızda & Zanaat Hikayemiz').length).toBeGreaterThan(0);
    });

    expect(screen.getByText('SEO & Bilgileri Düzenle')).toBeInTheDocument();
    expect(screen.getByText('Yeni Bölüm Ekle')).toBeInTheDocument();
  });

  it('opens page edit modal on clicking SEO button', async () => {
    const user = userEvent.setup();
    renderTab();

    await waitFor(() => {
      expect(screen.getAllByText('Hakkımızda & Zanaat Hikayemiz').length).toBeGreaterThan(0);
    });

    await user.click(screen.getByText('SEO & Bilgileri Düzenle'));

    expect(screen.getByText('Sayfa Bilgileri & SEO Düzenle')).toBeInTheDocument();
    expect(screen.getByText('SEO Başlığı (Meta Title)')).toBeInTheDocument();
  });

  it('opens new section modal on clicking Yeni Bölüm Ekle', async () => {
    const user = userEvent.setup();
    renderTab();

    await waitFor(() => {
      expect(screen.getByText('Yeni Bölüm Ekle')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Yeni Bölüm Ekle'));

    expect(screen.getByText('Yeni İçerik Bölümü Ekle')).toBeInTheDocument();
    expect(screen.getByText('Bölüm Anahtarı (section_key)')).toBeInTheDocument();
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminFaqTab } from '@/admin/content/components/AdminFaqTab';

describe('AdminFaqTab Component', () => {
  it('renders FAQ categories and their questions', async () => {
    render(<AdminFaqTab />);

    await waitFor(() => {
      expect(screen.getByText('Sıkça Sorulan Sorular Yönetimi')).toBeInTheDocument();
      expect(screen.getByText('Sipariş & Teslimat')).toBeInTheDocument();
    });

    expect(screen.getByText('Yeni Kategori Ekle')).toBeInTheDocument();
  });

  it('opens category modal on clicking Yeni Kategori Ekle', async () => {
    const user = userEvent.setup();
    render(<AdminFaqTab />);

    await waitFor(() => {
      expect(screen.getByText('Yeni Kategori Ekle')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Yeni Kategori Ekle'));

    expect(screen.getByText('Yeni FAQ Kategorisi Ekle')).toBeInTheDocument();
    expect(screen.getByText('Kategori Başlığı')).toBeInTheDocument();
  });
});

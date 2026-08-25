import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import { ProductFormGalleryTab } from '@/admin/products/components/ProductFormGalleryTab';
import { adminMediaService } from '@/admin/media/api/admin-media-service';
import { ToastProvider } from '@/admin/ui/ToastProvider';
import type { AdminProductMedia } from '@/admin/media/types';

vi.mock('@/admin/media/api/admin-media-service', () => ({
  adminMediaService: {
    getProductMedia: vi.fn(),
    uploadProductMedia: vi.fn(),
    updateMediaMetadata: vi.fn(),
    setPrimaryImage: vi.fn(),
    reorderMedia: vi.fn(),
    deleteProductMedia: vi.fn(),
  },
  validateMediaFile: vi.fn(),
}));

const mockMediaList: AdminProductMedia[] = [
  {
    id: 'med-1',
    product_id: 'prod-1',
    variant_id: null,
    media_type: 'image',
    url: 'https://example.com/vase-1.jpg',
    alt_text: 'Vazo Ana Görsel',
    width: 1200,
    height: 1600,
    sort_order: 1,
    is_primary: true,
    storage_bucket: 'public-media',
    storage_path: 'products/prod-1/vase-1.jpg',
    mime_type: 'image/jpeg',
    file_size_bytes: 102400,
    created_at: '2026-08-26T00:00:00Z',
  },
  {
    id: 'med-2',
    product_id: 'prod-1',
    variant_id: 'var-1',
    media_type: 'image',
    url: 'https://example.com/vase-detail.jpg',
    alt_text: 'Vazo Detay',
    width: 1200,
    height: 1600,
    sort_order: 2,
    is_primary: false,
    storage_bucket: 'public-media',
    storage_path: 'products/prod-1/vase-detail.jpg',
    mime_type: 'image/jpeg',
    file_size_bytes: 204800,
    created_at: '2026-08-26T00:00:00Z',
  },
];

function renderWithToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('ProductFormGalleryTab Component (Phase 2.7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminMediaService.getProductMedia).mockResolvedValue(mockMediaList);
    vi.mocked(adminMediaService.setPrimaryImage).mockResolvedValue();
    vi.mocked(adminMediaService.deleteProductMedia).mockResolvedValue();
  });

  it('renders product media gallery with image cards and primary badge', async () => {
    renderWithToast(<ProductFormGalleryTab productId="prod-1" />);

    await waitFor(() => {
      expect(screen.getByText(/Ürün Medya Galerisi/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Ana Görsel')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Vazo Ana Görsel')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Vazo Detay')).toBeInTheDocument();
  });

  it('sets primary image when clicking "Ana Yap" button', async () => {
    renderWithToast(<ProductFormGalleryTab productId="prod-1" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Vazo Detay')).toBeInTheDocument();
    });

    const setPrimaryBtn = screen.getByRole('button', { name: /Ana Yap/i });
    fireEvent.click(setPrimaryBtn);

    await waitFor(() => {
      expect(adminMediaService.setPrimaryImage).toHaveBeenCalledWith('prod-1', 'med-2');
    });
  });

  it('opens confirmation modal and deletes media item', async () => {
    renderWithToast(<ProductFormGalleryTab productId="prod-1" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Vazo Ana Görsel')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Görseli Sil');
    fireEvent.click(deleteButtons[0]);

    // Confirmation dialog should appear
    expect(screen.getByText(/Bu görseli silmek istediğinizden emin misiniz/i)).toBeInTheDocument();

    const dialog = screen.getByRole('alertdialog');
    const confirmBtn = within(dialog).getByRole('button', { name: 'Görseli Sil' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(adminMediaService.deleteProductMedia).toHaveBeenCalledWith('med-1');
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminCategoriesPage } from '@/admin/categories/pages/AdminCategoriesPage';
import { adminCategoryRepository } from '@/admin/categories/api/admin-category-repository';
import { ToastProvider } from '@/admin/ui/ToastProvider';
import type { AdminCategory } from '@/admin/categories/types';

const mockCategories: AdminCategory[] = [
  {
    id: 'cat-1',
    name: 'Masa Üstü Vazolar',
    slug: 'masa-ustu-vazolar',
    description: 'Konsol ve masaüstü modelleri',
    image_url: 'https://images.unsplash.com/photo-1',
    parent_id: null,
    active: true,
    sort_order: 1,
    seo_title: null,
    seo_description: null,
    created_at: '2026-08-21T00:00:00Z',
    updated_at: '2026-08-21T00:00:00Z',
  },
  {
    id: 'cat-2',
    name: 'Zemin & Anıt Vazolar',
    slug: 'zemin-anit-vazolar',
    description: 'Büyük mekan modelleri',
    image_url: null,
    parent_id: null,
    active: false,
    sort_order: 2,
    seo_title: null,
    seo_description: null,
    created_at: '2026-08-21T00:00:00Z',
    updated_at: '2026-08-21T00:00:00Z',
  },
];

function renderCategoriesPage() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <AdminCategoriesPage />
      </MemoryRouter>
    </ToastProvider>
  );
}

describe('AdminCategoriesPage Component (Phase 2.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders category list with table headers, records, and status badges', async () => {
    vi.spyOn(adminCategoryRepository, 'getAllCategories').mockResolvedValue(mockCategories);

    renderCategoriesPage();

    expect(screen.getByText('Kategori Yönetimi')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Masa Üstü Vazolar')).toBeInTheDocument();
      expect(screen.getByText('Zemin & Anıt Vazolar')).toBeInTheDocument();
      expect(screen.getByText('/masa-ustu-vazolar')).toBeInTheDocument();
    });

    expect(screen.getByText('Aktif')).toBeInTheDocument();
    expect(screen.getByText('Pasif')).toBeInTheDocument();
  });

  it('filters categories when search query is typed', async () => {
    const getAllSpy = vi.spyOn(adminCategoryRepository, 'getAllCategories').mockResolvedValue([mockCategories[0]]);

    renderCategoriesPage();

    await waitFor(() => {
      expect(screen.getByText('Masa Üstü Vazolar')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Kategori adı veya slug ara...');
    fireEvent.change(searchInput, { target: { value: 'masa' } });

    await waitFor(() => {
      expect(getAllSpy).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'masa' })
      );
    });
  });

  it('opens create modal, generates slug, and submits new category', async () => {
    vi.spyOn(adminCategoryRepository, 'getAllCategories').mockResolvedValue(mockCategories);
    const createSpy = vi.spyOn(adminCategoryRepository, 'createCategory').mockResolvedValue({
      id: 'cat-new',
      name: 'Heykelsi Objeler',
      slug: 'heykelsi-objeler',
      description: null,
      image_url: null,
      parent_id: null,
      active: true,
      sort_order: 3,
      seo_title: null,
      seo_description: null,
      created_at: '2026-08-26T00:00:00Z',
      updated_at: '2026-08-26T00:00:00Z',
    });

    renderCategoriesPage();

    await waitFor(() => {
      expect(screen.getByText('Masa Üstü Vazolar')).toBeInTheDocument();
    });

    const newBtn = screen.getByRole('button', { name: 'Yeni Kategori' });
    fireEvent.click(newBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Yeni Kategori Ekle')).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Kategori Adı/);
    fireEvent.change(nameInput, { target: { value: 'Heykelsi Objeler' } });

    const submitBtn = screen.getByRole('button', { name: 'Kategori Oluştur' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Heykelsi Objeler',
          slug: 'heykelsi-objeler',
        })
      );
    });
  });

  it('opens edit modal and updates an existing category', async () => {
    vi.spyOn(adminCategoryRepository, 'getAllCategories').mockResolvedValue(mockCategories);
    const updateSpy = vi.spyOn(adminCategoryRepository, 'updateCategory').mockResolvedValue({
      ...mockCategories[0],
      name: 'Masa Üstü Seramik Vazolar',
    });

    renderCategoriesPage();

    await waitFor(() => {
      expect(screen.getByText('Masa Üstü Vazolar')).toBeInTheDocument();
    });

    const editBtn = screen.getByLabelText('Masa Üstü Vazolar kategorisini düzenle');
    fireEvent.click(editBtn);

    expect(screen.getByText('Kategoriyi Düzenle')).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Kategori Adı/);
    fireEvent.change(nameInput, { target: { value: 'Masa Üstü Seramik Vazolar' } });

    const saveBtn = screen.getByRole('button', { name: 'Değişiklikleri Kaydet' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        'cat-1',
        expect.objectContaining({
          name: 'Masa Üstü Seramik Vazolar',
        })
      );
    });
  });

  it('toggles category active status', async () => {
    vi.spyOn(adminCategoryRepository, 'getAllCategories').mockResolvedValue(mockCategories);
    const toggleSpy = vi.spyOn(adminCategoryRepository, 'toggleCategoryActive').mockResolvedValue({
      ...mockCategories[0],
      active: false,
    });

    renderCategoriesPage();

    await waitFor(() => {
      expect(screen.getByText('Masa Üstü Vazolar')).toBeInTheDocument();
    });

    const toggleBtn = screen.getByLabelText('Pasife Al');
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(toggleSpy).toHaveBeenCalledWith('cat-1', false);
    });
  });

  it('opens delete confirmation dialog and deletes category', async () => {
    vi.spyOn(adminCategoryRepository, 'getAllCategories').mockResolvedValue(mockCategories);
    const deleteSpy = vi.spyOn(adminCategoryRepository, 'deleteCategory').mockResolvedValue();

    renderCategoriesPage();

    await waitFor(() => {
      expect(screen.getByText('Masa Üstü Vazolar')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByLabelText('Masa Üstü Vazolar kategorisini sil');
    fireEvent.click(deleteBtn);

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText(/kategorisini kalıcı olarak silmek istediğinizden emin misiniz/)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Kategoriyi Sil' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('cat-1');
    });
  });

  it('renders error state and retries fetching on button click', async () => {
    const getAllSpy = vi
      .spyOn(adminCategoryRepository, 'getAllCategories')
      .mockRejectedValueOnce(new Error('Ağ hatası'))
      .mockResolvedValueOnce(mockCategories);

    renderCategoriesPage();

    await waitFor(() => {
      expect(screen.getByText('Ağ hatası')).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: 'Yeniden Dene' });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(getAllSpy).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Masa Üstü Vazolar')).toBeInTheDocument();
    });
  });
});

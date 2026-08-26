import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminCollectionsPage } from '@/admin/collections/pages/AdminCollectionsPage';
import { adminCollectionRepository } from '@/admin/collections/api/admin-collection-repository';
import { ToastProvider } from '@/admin/ui/ToastProvider';
import type { AdminCollection } from '@/admin/collections/types';

const mockCollections: AdminCollection[] = [
  {
    id: 'col-1',
    name: 'Nordik Sessizlik Serisi',
    slug: 'nordik-sessizlik',
    subtitle: 'Yumuşak kavisler ve mineral mat sırlı yüzeyler',
    description: 'Kuzey doğasından ilham alan seri',
    story_markdown: 'Zamansız formlar...',
    hero_image_url: 'https://images.unsplash.com/photo-1',
    active: true,
    featured: true,
    sort_order: 1,
    seo_title: null,
    seo_description: null,
    created_at: '2026-08-21T00:00:00Z',
    updated_at: '2026-08-21T00:00:00Z',
  },
  {
    id: 'col-2',
    name: 'Amforik Kıvrımlar 2026',
    slug: 'amforik-kivrimlar',
    subtitle: 'Antik hatların çağdaş brütalizm ile buluşması',
    description: 'Akdeniz heykelsi serisi',
    story_markdown: null,
    hero_image_url: null,
    active: false,
    featured: false,
    sort_order: 2,
    seo_title: null,
    seo_description: null,
    created_at: '2026-08-21T00:00:00Z',
    updated_at: '2026-08-21T00:00:00Z',
  },
];

function renderCollectionsPage() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <AdminCollectionsPage />
      </MemoryRouter>
    </ToastProvider>
  );
}

describe('AdminCollectionsPage Component (Phase 2.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders collection list with headers, records, and star icon for featured item', async () => {
    vi.spyOn(adminCollectionRepository, 'getAllCollections').mockResolvedValue(mockCollections);

    renderCollectionsPage();

    expect(screen.getByText('Koleksiyon Kürasyonu')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Nordik Sessizlik Serisi')).toBeInTheDocument();
      expect(screen.getByText('Amforik Kıvrımlar 2026')).toBeInTheDocument();
      expect(screen.getByText('/nordik-sessizlik')).toBeInTheDocument();
    });

    expect(screen.getByText('Aktif')).toBeInTheDocument();
    expect(screen.getByText('Pasif')).toBeInTheDocument();
  });

  it('filters collections when search query is entered', async () => {
    const getAllSpy = vi
      .spyOn(adminCollectionRepository, 'getAllCollections')
      .mockResolvedValue([mockCollections[0]]);

    renderCollectionsPage();

    await waitFor(() => {
      expect(screen.getByText('Nordik Sessizlik Serisi')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Koleksiyon adı, slug veya alt başlık ara...');
    fireEvent.change(searchInput, { target: { value: 'nordik' } });

    await waitFor(() => {
      expect(getAllSpy).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'nordik' })
      );
    });
  });

  it('opens create modal and creates a new collection', async () => {
    vi.spyOn(adminCollectionRepository, 'getAllCollections').mockResolvedValue(mockCollections);
    const createSpy = vi.spyOn(adminCollectionRepository, 'createCollection').mockResolvedValue({
      id: 'col-new',
      name: 'Monokrom Brütalizm',
      slug: 'monokrom-brutalizm',
      subtitle: 'Antrasit ve bazalt taşın monolitik gücü',
      description: null,
      story_markdown: null,
      hero_image_url: null,
      active: true,
      featured: true,
      sort_order: 3,
      seo_title: null,
      seo_description: null,
      created_at: '2026-08-26T00:00:00Z',
      updated_at: '2026-08-26T00:00:00Z',
    });

    renderCollectionsPage();

    await waitFor(() => {
      expect(screen.getByText('Nordik Sessizlik Serisi')).toBeInTheDocument();
    });

    const newBtn = screen.getByRole('button', { name: 'Yeni Koleksiyon' });
    fireEvent.click(newBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Yeni Koleksiyon Ekle')).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Koleksiyon Adı/);
    fireEvent.change(nameInput, { target: { value: 'Monokrom Brütalizm' } });

    const submitBtn = screen.getByRole('button', { name: 'Koleksiyon Oluştur' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Monokrom Brütalizm',
          slug: 'monokrom-brutalizm',
        })
      );
    });
  });

  it('opens edit modal and updates collection', async () => {
    vi.spyOn(adminCollectionRepository, 'getAllCollections').mockResolvedValue(mockCollections);
    const updateSpy = vi.spyOn(adminCollectionRepository, 'updateCollection').mockResolvedValue({
      ...mockCollections[0],
      name: 'Nordik Sessizlik Serisi 2026',
    });

    renderCollectionsPage();

    await waitFor(() => {
      expect(screen.getByText('Nordik Sessizlik Serisi')).toBeInTheDocument();
    });

    const editBtn = screen.getByLabelText('Nordik Sessizlik Serisi koleksiyonunu düzenle');
    fireEvent.click(editBtn);

    expect(screen.getByText('Koleksiyonu Düzenle')).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Koleksiyon Adı/);
    fireEvent.change(nameInput, { target: { value: 'Nordik Sessizlik Serisi 2026' } });

    const saveBtn = screen.getByRole('button', { name: 'Değişiklikleri Kaydet' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        'col-1',
        expect.objectContaining({
          name: 'Nordik Sessizlik Serisi 2026',
        })
      );
    });
  });

  it('toggles collection featured status (homepage showcase)', async () => {
    vi.spyOn(adminCollectionRepository, 'getAllCollections').mockResolvedValue(mockCollections);
    const toggleFeaturedSpy = vi
      .spyOn(adminCollectionRepository, 'toggleCollectionFeatured')
      .mockResolvedValue({
        ...mockCollections[0],
        featured: false,
      });

    renderCollectionsPage();

    await waitFor(() => {
      expect(screen.getByText('Nordik Sessizlik Serisi')).toBeInTheDocument();
    });

    const featuredBtn = screen.getByLabelText('Vitrinden Kaldır');
    fireEvent.click(featuredBtn);

    await waitFor(() => {
      expect(toggleFeaturedSpy).toHaveBeenCalledWith('col-1', false);
    });
  });

  it('opens delete confirmation dialog and deletes collection', async () => {
    vi.spyOn(adminCollectionRepository, 'getAllCollections').mockResolvedValue(mockCollections);
    const deleteSpy = vi.spyOn(adminCollectionRepository, 'deleteCollection').mockResolvedValue();

    renderCollectionsPage();

    await waitFor(() => {
      expect(screen.getByText('Nordik Sessizlik Serisi')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByLabelText('Nordik Sessizlik Serisi koleksiyonunu sil');
    fireEvent.click(deleteBtn);

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText(/koleksiyonunu kalıcı olarak silmek istediğinizden emin misiniz/)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Koleksiyonu Sil' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('col-1');
    });
  });
});

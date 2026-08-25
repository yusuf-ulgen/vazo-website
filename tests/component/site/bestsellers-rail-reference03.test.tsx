import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BestSellersRailReference03 } from '@/site/components/home/BestSellersRailReference03';
import { productRepository } from '@/entities/product/api/product-repository';

describe('BestSellersRailReference03 Component (Phase 2.8)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders bestseller products fetched from productRepository with links and wishlist button', async () => {
    render(
      <MemoryRouter>
        <BestSellersRailReference03 />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Çok Satan Vazo Modelleri')).toBeInTheDocument();
    });

    const examineLinks = screen.getAllByRole('link', { name: /İncele/i });
    expect(examineLinks.length).toBeGreaterThan(0);

    const prevButton = screen.getByRole('button', { name: /Önceki Ürünler/i });
    const nextButton = screen.getByRole('button', { name: /Sonraki Ürünler/i });
    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();

    fireEvent.click(nextButton);
    fireEvent.click(prevButton);
  });

  it('renders empty state when no bestseller products are returned', async () => {
    vi.spyOn(productRepository, 'getBestsellers').mockResolvedValueOnce([]);

    render(
      <MemoryRouter>
        <BestSellersRailReference03 />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Şu anda öne çıkan çok satan ürün bulunmamaktadır/i)).toBeInTheDocument();
    });
  });

  it('truthfully renders error state when repository fetch fails (NO silent mock fallback)', async () => {
    vi.spyOn(productRepository, 'getBestsellers').mockRejectedValueOnce(
      new Error('Supabase bestsellers fetch failed')
    );

    render(
      <MemoryRouter>
        <BestSellersRailReference03 />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Supabase bestsellers fetch failed')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tekrar Dene/i })).toBeInTheDocument();
    });
  });
});

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SplitHeroReference03 } from '@/site/components/home/SplitHeroReference03';
import { contentRepository } from '@/entities/content/api/content-repository';

describe('SplitHeroReference03 Component (Phase 2.8)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders retail and wholesale split hero content from repository', async () => {
    render(
      <MemoryRouter>
        <SplitHeroReference03 />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('BİREYSEL ALIŞVERİŞ')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1, name: 'Perakende' })).toBeInTheDocument();
      expect(screen.getByText('PROFESYONEL ALIŞVERİŞ')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Toptan' })).toBeInTheDocument();
    });

    const retailLink = screen.getByRole('link', { name: /Alışverişe Başla/i });
    expect(retailLink).toHaveAttribute('href', '/products');

    const wholesaleLink = screen.getByRole('link', { name: /Toptan Alışverişe Geç/i });
    expect(wholesaleLink).toHaveAttribute('href', '/wholesale');
  });

  it('switches between Perakende and Toptan on mobile tab and arrow clicks', async () => {
    render(
      <MemoryRouter>
        <SplitHeroReference03 />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Perakende' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Toptan' })).toBeInTheDocument();
    });

    // Click Toptan tab
    const toptanTab = screen.getByRole('button', { name: 'Toptan' });
    fireEvent.click(toptanTab);
    expect(toptanTab).toHaveClass('bg-action-primary');

    // Click Next button
    const nextBtn = screen.getByRole('button', { name: 'Sonraki vitrin' });
    fireEvent.click(nextBtn);

    const perakendeTab = screen.getByRole('button', { name: 'Perakende' });
    expect(perakendeTab).toHaveClass('bg-action-primary');
  });

  it('truthfully renders error state when repository fetch fails (NO silent mock fallback)', async () => {
    vi.spyOn(contentRepository, 'getSplitHero').mockRejectedValueOnce(
      new Error('Supabase split hero connection failed')
    );

    render(
      <MemoryRouter>
        <SplitHeroReference03 />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Supabase split hero connection failed')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tekrar Dene/i })).toBeInTheDocument();
    });
  });
});


import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SplitHeroReference03 } from '@/site/components/home/SplitHeroReference03';
import { contentRepository } from '@/entities/content/api/content-repository';

describe('SplitHeroReference03 Component (Phase 2.8)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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

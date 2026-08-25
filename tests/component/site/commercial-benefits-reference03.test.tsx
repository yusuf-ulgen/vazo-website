import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommercialBenefitsReference03 } from '@/site/components/home/CommercialBenefitsReference03';
import { contentRepository } from '@/entities/content/api/content-repository';

describe('CommercialBenefitsReference03 Component (Phase 2.8)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders 5-column commercial benefits from contentRepository', async () => {
    render(
      <MemoryRouter>
        <CommercialBenefitsReference03 />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('NEDEN VAZO STUDIO?')).toBeInTheDocument();
      expect(screen.getByText('Ticari Avantajlarınız')).toBeInTheDocument();
      expect(screen.getByText('İç Mimarlar & Projelere Özel')).toBeInTheDocument();
    });
  });

  it('truthfully renders error state when repository fetch fails (NO silent mock fallback)', async () => {
    vi.spyOn(contentRepository, 'getWholesaleBenefits').mockRejectedValueOnce(
      new Error('Supabase wholesale benefits failed')
    );

    render(
      <MemoryRouter>
        <CommercialBenefitsReference03 />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Supabase wholesale benefits failed')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tekrar Dene/i })).toBeInTheDocument();
    });
  });
});

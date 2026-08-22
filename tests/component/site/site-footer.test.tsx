import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { SiteFooter } from '@/site/components/SiteFooter';
import { renderWithRouter } from 'tests/utils/render-utils';

describe('SiteFooter Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders footer navigation links, studio address, and legal links', () => {
    renderWithRouter(<SiteFooter />);

    expect(screen.getByText('Alışveriş')).toBeInTheDocument();
    expect(screen.getByText('Toptan')).toBeInTheDocument();
    expect(screen.getByText('Müşteri Deneyimi')).toBeInTheDocument();
    expect(screen.getByText('Gizlilik & KVKK')).toBeInTheDocument();
    expect(screen.getByText('Kullanım Koşulları')).toBeInTheDocument();
    expect(screen.getByText('Teslimat & İade')).toBeInTheDocument();
  });
});

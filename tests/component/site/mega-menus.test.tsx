import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { PerakendeMegaMenu } from '@/site/components/PerakendeMegaMenu';
import { ToptanMegaMenu } from '@/site/components/ToptanMegaMenu';
import { renderWithRouter } from 'tests/utils/render-utils';

describe('Mega Menus (Perakende & Toptan)', () => {
  it('renders PerakendeMegaMenu with category groups and promo card', async () => {
    renderWithRouter(<PerakendeMegaMenu isOpen={true} onClose={vi.fn()} />);

    expect(await screen.findByText('Kategoriler')).toBeInTheDocument();
    expect(screen.getByText('Tüm Koleksiyon')).toBeInTheDocument();
  });

  it('renders ToptanMegaMenu with B2B portal options', async () => {
    renderWithRouter(<ToptanMegaMenu isOpen={true} onClose={vi.fn()} />);

    expect(await screen.findByText('Toptan Çözümleri')).toBeInTheDocument();
    expect(screen.getByText('Sektörel Projeler')).toBeInTheDocument();
  });

  it('renders nothing when isOpen is false', () => {
    const { container: containerRetail } = renderWithRouter(
      <PerakendeMegaMenu isOpen={false} onClose={vi.fn()} />
    );
    expect(containerRetail.firstChild).toBeNull();

    const { container: containerWholesale } = renderWithRouter(
      <ToptanMegaMenu isOpen={false} onClose={vi.fn()} />
    );
    expect(containerWholesale.firstChild).toBeNull();
  });
});

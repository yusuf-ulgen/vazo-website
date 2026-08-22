import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { MobileNavDrawer } from '@/site/components/MobileNavDrawer';
import { renderWithRouter } from 'tests/utils/render-utils';
import { wishlistStore } from '@/shared/stores/wishlist-store';

describe('MobileNavDrawer Component', () => {
  beforeEach(() => {
    wishlistStore.clear();
    vi.restoreAllMocks();
  });

  it('renders drawer links, handles retail & wholesale accordions, and wishlist badge', () => {
    act(() => {
      wishlistStore.toggle('prod-1');
      wishlistStore.toggle('prod-2');
    });

    const handleClose = vi.fn();
    const handleOpenSearch = vi.fn();

    renderWithRouter(
      <MobileNavDrawer
        isOpen={true}
        onClose={handleClose}
        onOpenSearch={handleOpenSearch}
      />
    );

    expect(screen.getByRole('dialog', { name: 'Mobil Gezinme Menüsü' })).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // wishlist count badge

    // Retail Accordion
    const retailAccordionBtn = screen.getByText('Perakende Koleksiyonu');
    fireEvent.click(retailAccordionBtn);
    expect(screen.getByText('Masa Üstü Vazolar')).toBeInTheDocument();

    // Wholesale Accordion
    const wholesaleAccordionBtn = screen.getByText('Toptan Portalı');
    fireEvent.click(wholesaleAccordionBtn);
    expect(screen.getByText('Toptan Satış Programı')).toBeInTheDocument();

    // Search button
    const searchBtn = screen.getByText('Ürün veya model ara...');
    fireEvent.click(searchBtn);
    expect(handleOpenSearch).toHaveBeenCalledTimes(1);

    // Close button
    const closeBtn = screen.getByRole('button', { name: 'Menüyü Kapat' });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  it('closes on Escape key press', () => {
    const handleClose = vi.fn();
    renderWithRouter(<MobileNavDrawer isOpen={true} onClose={handleClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = renderWithRouter(
      <MobileNavDrawer isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });
});

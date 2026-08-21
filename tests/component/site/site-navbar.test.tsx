import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { SiteNavbar } from '@/site/components/SiteNavbar';
import { renderWithRouter } from 'tests/utils/render-utils';
import { cartStore } from '@/shared/stores/cart-store';
import { wishlistStore } from '@/shared/stores/wishlist-store';
import { createProduct, createVariant } from 'tests/factories/product.factory';

describe('SiteNavbar Component', () => {
  beforeEach(() => {
    cartStore.clear();
    wishlistStore.clear();
    vi.restoreAllMocks();
  });

  it('renders brand logo and primary navigation links', () => {
    renderWithRouter(<SiteNavbar />);

    expect(screen.getByRole('link', { name: 'Vazo Studio' })).toBeInTheDocument();
    expect(screen.getByText('Koleksiyonlar')).toBeInTheDocument();
    expect(screen.getByText('Toptan')).toBeInTheDocument();
  });

  it('opens search, cart drawer, and mobile nav modals when clicked', () => {
    renderWithRouter(<SiteNavbar />);

    const searchBtn = screen.getByRole('button', { name: 'Ürün Ara (CMD+K)' });
    fireEvent.click(searchBtn);
    expect(screen.getByRole('dialog', { name: 'Ürün Arama Modalı' })).toBeInTheDocument();

    const cartBtn = screen.getByRole('button', { name: 'Alışveriş Sepeti' });
    fireEvent.click(cartBtn);
    expect(screen.getByRole('dialog', { name: 'Alışveriş Sepeti Çekmecesi' })).toBeInTheDocument();

    const menuBtn = screen.getByRole('button', { name: 'Menüyü Aç' });
    fireEvent.click(menuBtn);
    expect(screen.getByRole('dialog', { name: 'Mobil Gezinme Menüsü' })).toBeInTheDocument();
  });

  it('triggers search modal on CMD+K / CTRL+K keyboard shortcut', () => {
    renderWithRouter(<SiteNavbar />);

    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(screen.getByRole('dialog', { name: 'Ürün Arama Modalı' })).toBeInTheDocument();
  });

  it('handles hover and mouse-leave timer on Perakende and Toptan mega menus', async () => {
    renderWithRouter(<SiteNavbar />);

    const perakendeBtn = screen.getByRole('button', { name: 'Perakende' });
    fireEvent.mouseEnter(perakendeBtn.parentElement!);
    expect(await screen.findByText('Kategoriler')).toBeInTheDocument();

    fireEvent.mouseLeave(perakendeBtn.parentElement!);
    await new Promise((r) => setTimeout(r, 200));

    const toptanBtn = screen.getByRole('button', { name: 'Toptan' });
    fireEvent.mouseEnter(toptanBtn.parentElement!);
    expect(await screen.findByText('Toptan & B2B Çözümleri')).toBeInTheDocument();
  });

  it('displays cart and wishlist item badge counts', () => {
    act(() => {
      cartStore.addItem(createProduct(), createVariant(), 3);
      wishlistStore.toggle('p1');
      wishlistStore.toggle('p2');
    });

    renderWithRouter(<SiteNavbar />);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});

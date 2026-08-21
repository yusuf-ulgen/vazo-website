import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { CartDrawer } from '@/site/components/CartDrawer';
import { renderWithRouter } from 'tests/utils/render-utils';
import { cartStore } from '@/shared/stores/cart-store';
import { createProduct, createVariant } from 'tests/factories/product.factory';

describe('CartDrawer Component', () => {
  beforeEach(() => {
    cartStore.clear();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = renderWithRouter(<CartDrawer isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders empty cart state with CTA to collections', () => {
    renderWithRouter(<CartDrawer isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Alışveriş Sepeti Çekmecesi' })).toBeInTheDocument();
    expect(screen.getByText('Sepetiniz Boş')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Koleksiyonu İncele/ })).toHaveAttribute('href', '/products');
  });

  it('renders cart items, free shipping congratulations, quantity controls, and checkout link', () => {
    const product = createProduct({
      name: 'Mat Zemin Vazosu',
      retailPrice: 3000,
      images: [{ id: 'm1', url: 'https://example.com/vazo.jpg', isPrimary: true, alt: 'Vazo' }],
    });
    const variant = createVariant({ name: 'Antrasit', retailPrice: 3000, stockQuantity: 10 });
    cartStore.addItem(product, variant, 2); // 6000 >= 5000 threshold

    const handleClose = vi.fn();
    renderWithRouter(<CartDrawer isOpen={true} onClose={handleClose} />);

    expect(screen.getByText('Mat Zemin Vazosu')).toBeInTheDocument();
    expect(screen.getByText('2 Ürün')).toBeInTheDocument();
    expect(screen.getByText('Tebrikler! Siparişiniz için kargo ücretsiz.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Mat Zemin Vazosu' })).toBeInTheDocument();

    // Click checkout link
    const checkoutLink = screen.getByRole('link', { name: /Sepete Git & Öde/ });
    fireEvent.click(checkoutLink);
    expect(handleClose).toHaveBeenCalled();

    // Delete item
    const deleteBtn = screen.getByRole('button', { name: 'Ürünü Sil' });
    fireEvent.click(deleteBtn);

    expect(screen.getByText('Sepetiniz Boş')).toBeInTheDocument();
  });

  it('closes on Escape key press or close button click', () => {
    const handleClose = vi.fn();
    renderWithRouter(<CartDrawer isOpen={true} onClose={handleClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);

    const closeBtn = screen.getByRole('button', { name: 'Sepeti Kapat' });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});

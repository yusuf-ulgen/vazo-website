import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { CartPage } from '@/site/pages/CartPage';
import { renderWithRouter } from 'tests/utils/render-utils';
import { cartStore } from '@/shared/stores/cart-store';
import { MOCK_DISCOUNT_CODES_KEY } from '@/shared/stores/cart-discount';
import { createProduct, createVariant } from 'tests/factories/product.factory';
import type { DiscountCode } from '@/admin/discounts/types';

describe('CartPage Discount Coupon Tests', () => {
  const mockDiscount: DiscountCode = {
    id: 'disc-1',
    code: 'INDIRIM20',
    discount_percentage: 20,
    scope: 'all',
    scope_id: null,
    scope_label: null,
    is_active: true,
    usage_limit: null,
    usage_count: 0,
    expires_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    localStorage.clear();
    cartStore.clear();
    localStorage.setItem(MOCK_DISCOUNT_CODES_KEY, JSON.stringify([mockDiscount]));

    const product = createProduct({
      id: 'prod-vazo',
      name: 'Heykelsi Vazo',
      retailPrice: 1000,
      images: [{ id: 'm1', url: 'https://example.com/vazo.jpg', isPrimary: true, alt: 'Vazo' }],
    });
    const variant = createVariant({ id: 'var-1', name: 'Standart', retailPrice: 1000, stockQuantity: 10 });
    cartStore.addItem(product, variant, 1);
  });

  it('renders coupon input and applies a valid coupon successfully', async () => {
    renderWithRouter(<CartPage />);

    expect(screen.getByPlaceholderText('İndirim kuponu girin')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('İndirim kuponu girin');
    fireEvent.change(input, { target: { value: 'INDIRIM20' } });

    const form = input.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('INDIRIM20')).toBeInTheDocument();
      expect(screen.getByText('(-%20)')).toBeInTheDocument();
      expect(screen.getByText('İndirim Kuponu (%20)')).toBeInTheDocument();
    });

    // Remove coupon
    const removeBtn = screen.getByRole('button', { name: 'Kuponu Kaldır' });
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(screen.queryByText('INDIRIM20')).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText('İndirim kuponu girin')).toBeInTheDocument();
    });
  });

  it('shows error when coupon code does not exist', async () => {
    renderWithRouter(<CartPage />);

    const input = screen.getByPlaceholderText('İndirim kuponu girin');
    fireEvent.change(input, { target: { value: 'GECERSIZKOD' } });

    const form = input.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Girdiğiniz indirim kodu bulunamadı.')).toBeInTheDocument();
    });
  });
});

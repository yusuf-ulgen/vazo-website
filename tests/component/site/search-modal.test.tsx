import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { SearchModal } from '@/site/components/SearchModal';
import { renderWithRouter } from 'tests/utils/render-utils';
import { productRepository } from '@/entities/product/api/product-repository';
import { createProduct } from 'tests/factories/product.factory';

describe('SearchModal Component', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.restoreAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = renderWithRouter(<SearchModal isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders search modal with A11y dialog semantics and popular searches when empty', () => {
    renderWithRouter(<SearchModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Ürün Arama Modalı' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Vazo modeli veya materyal ara/)).toBeInTheDocument();
    expect(screen.getByText('Popüler Aramalar')).toBeInTheDocument();
  });

  it('sets query when a popular search term tag is clicked', () => {
    renderWithRouter(<SearchModal isOpen={true} onClose={vi.fn()} />);

    const tag = screen.getByRole('button', { name: 'Amforik Taş Vazo' });
    fireEvent.click(tag);

    const input = screen.getByPlaceholderText(/Vazo modeli veya materyal ara/);
    expect((input as HTMLInputElement).value).toBe('Amforik Taş Vazo');
  });

  it('debounces search input, displays matching results, and closes on result click', async () => {
    const mockProduct = createProduct({ name: 'Nordik Stoneware Vazo', slug: 'nordik-vazo' });
    vi.spyOn(productRepository, 'getProducts').mockResolvedValue([mockProduct]);
    const handleClose = vi.fn();

    renderWithRouter(<SearchModal isOpen={true} onClose={handleClose} />);

    const input = screen.getByPlaceholderText(/Vazo modeli veya materyal ara/);
    fireEvent.change(input, { target: { value: 'Nordik' } });

    await act(async () => {
      vi.advanceTimersByTime(250);
    });

    const resultLink = await screen.findByText('Nordik Stoneware Vazo');
    expect(resultLink).toBeInTheDocument();

    fireEvent.click(resultLink);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('displays search error state when repository rejects', async () => {
    vi.spyOn(productRepository, 'getProducts').mockRejectedValue(new Error('Arama servisi yanıt vermiyor'));

    renderWithRouter(<SearchModal isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText(/Vazo modeli veya materyal ara/);
    fireEvent.change(input, { target: { value: 'HataTesti' } });

    await act(async () => {
      vi.advanceTimersByTime(250);
    });

    expect(await screen.findByText('Arama servisi yanıt vermiyor')).toBeInTheDocument();
  });

  it('shows no results message when query returns empty array', async () => {
    vi.spyOn(productRepository, 'getProducts').mockResolvedValue([]);

    renderWithRouter(<SearchModal isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText(/Vazo modeli veya materyal ara/);
    fireEvent.change(input, { target: { value: 'BilinmeyenModel' } });

    await act(async () => {
      vi.advanceTimersByTime(250);
    });

    expect(await screen.findByText('Sonuç Bulunamadı')).toBeInTheDocument();
  });

  it('clears query when clear button is clicked', () => {
    renderWithRouter(<SearchModal isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText(/Vazo modeli veya materyal ara/);
    fireEvent.change(input, { target: { value: 'Vazo' } });

    const clearBtn = screen.getByRole('button', { name: 'Aramayı Temizle' });
    fireEvent.click(clearBtn);

    expect((input as HTMLInputElement).value).toBe('');
  });

  it('closes on Escape key press or close button click or backdrop click', () => {
    const handleClose = vi.fn();
    renderWithRouter(<SearchModal isOpen={true} onClose={handleClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);

    const closeBtn = screen.getByRole('button', { name: 'Kapat' });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(2);

    const backdrop = document.querySelector('.bg-neutral-950\\/60');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(handleClose).toHaveBeenCalledTimes(3);
    }
  });
});

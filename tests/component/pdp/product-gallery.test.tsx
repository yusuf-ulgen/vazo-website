import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductGallery } from '@/site/components/pdp/ProductGallery';
import { createProductImage } from 'tests/factories/product.factory';

describe('ProductGallery Component', () => {
  const media = [
    createProductImage({ id: 'img-1', url: 'https://example.com/1.jpg', alt: 'Görsel 1' }),
    createProductImage({ id: 'img-2', url: 'https://example.com/2.jpg', alt: 'Görsel 2' }),
  ];

  it('renders fallback image when media array is empty', () => {
    render(<ProductGallery media={[]} productName="Boş Görselli Vazo" />);
    expect(screen.getByRole('img', { name: 'Boş Görselli Vazo' })).toBeInTheDocument();
  });

  it('renders main image and thumbnails', () => {
    render(<ProductGallery media={media} productName="Test Vazo" />);

    expect(screen.getByRole('img', { name: 'Görsel 1' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Test Vazo görsel/ }).length).toBe(2);
  });

  it('switches image when clicking next / previous buttons and thumbnails', () => {
    render(<ProductGallery media={media} productName="Test Vazo" />);

    const nextBtn = screen.getByRole('button', { name: 'Sonraki Görsel' });
    fireEvent.click(nextBtn);
    expect(screen.getByRole('img', { name: 'Görsel 2' })).toBeInTheDocument();

    const prevBtn = screen.getByRole('button', { name: 'Önceki Görsel' });
    fireEvent.click(prevBtn);
    expect(screen.getByRole('img', { name: 'Görsel 1' })).toBeInTheDocument();

    const thumb2 = screen.getByRole('button', { name: 'Test Vazo görsel 2' });
    fireEvent.click(thumb2);
    expect(screen.getByRole('img', { name: 'Görsel 2' })).toBeInTheDocument();
  });

  it('opens and closes fullscreen zoom modal with dialog semantics and backdrop click', () => {
    render(<ProductGallery media={media} productName="Test Vazo" />);

    const zoomBtn = screen.getByRole('button', { name: 'Görseli Büyüt' });
    fireEvent.click(zoomBtn);

    expect(screen.getByRole('dialog', { name: 'Büyütülmüş Ürün Görseli' })).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: 'Kapat' });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog', { name: 'Büyütülmüş Ürün Görseli' })).not.toBeInTheDocument();

    // Reopen and close with backdrop click
    fireEvent.click(zoomBtn);
    const dialog = screen.getByRole('dialog', { name: 'Büyütülmüş Ürün Görseli' });
    fireEvent.click(dialog);
    expect(screen.queryByRole('dialog', { name: 'Büyütülmüş Ürün Görseli' })).not.toBeInTheDocument();
  });

  it('handles single image and image with no alt or id', () => {
    const singleMedia = [
      {
        url: 'https://example.com/single.jpg',
      },
    ];

    render(<ProductGallery media={singleMedia} productName="Tekli Vazo" />);
    expect(screen.queryByRole('button', { name: 'Sonraki Görsel' })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Tekli Vazo' })).toBeInTheDocument();
  });
});

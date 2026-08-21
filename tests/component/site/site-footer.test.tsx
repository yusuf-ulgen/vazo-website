import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { SiteFooter } from '@/site/components/SiteFooter';
import { renderWithRouter } from 'tests/utils/render-utils';
import { contentRepository } from '@/entities/content/api/content-repository';

describe('SiteFooter Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders footer navigation links, studio address, and legal links', () => {
    renderWithRouter(<SiteFooter />);

    expect(screen.getByText('Alışveriş & Koleksiyon')).toBeInTheDocument();
    expect(screen.getByText('Toptan & B2B')).toBeInTheDocument();
    expect(screen.getByText('Müşteri Deneyimi & Bülten')).toBeInTheDocument();
    expect(screen.getByText('Gizlilik & KVKK')).toBeInTheDocument();
    expect(screen.getByText('Kullanım Koşulları')).toBeInTheDocument();
  });

  it('submits newsletter and shows success message only on server response', async () => {
    vi.spyOn(contentRepository, 'subscribeNewsletter').mockResolvedValue({
      success: true,
      message: 'Kaydoldunuz',
    });

    renderWithRouter(<SiteFooter />);

    const emailInput = screen.getByPlaceholderText('E-posta adresiniz...');
    fireEvent.change(emailInput, { target: { value: 'footer-test@example.com' } });

    const submitBtn = screen.getByRole('button', { name: 'Abone Ol' });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Bülten kaydınız tamamlandı.')).toBeInTheDocument();
  });

  it('displays error message when footer newsletter subscription fails', async () => {
    vi.spyOn(contentRepository, 'subscribeNewsletter').mockRejectedValue(
      new Error('Bülten servisi yanıt vermiyor')
    );

    renderWithRouter(<SiteFooter />);

    const emailInput = screen.getByPlaceholderText('E-posta adresiniz...');
    fireEvent.change(emailInput, { target: { value: 'footer-error@example.com' } });

    const submitBtn = screen.getByRole('button', { name: 'Abone Ol' });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Bülten servisi yanıt vermiyor')).toBeInTheDocument();
  });
});

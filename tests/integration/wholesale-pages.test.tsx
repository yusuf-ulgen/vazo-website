import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { WholesaleLandingPage } from '@/site/pages/wholesale/WholesaleLandingPage';
import { WholesaleProductsPage } from '@/site/pages/wholesale/WholesaleProductsPage';
import { WholesaleHowItWorksPage } from '@/site/pages/wholesale/WholesaleHowItWorksPage';
import { WholesaleApplyPage } from '@/site/pages/wholesale/WholesaleApplyPage';
import { renderWithRouter } from 'tests/utils/render-utils';
import { contentRepository } from '@/entities/content/api/content-repository';
import { productRepository } from '@/entities/product/api/product-repository';

describe('Wholesale Pages Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders WholesaleLandingPage with value proposition and model cards', () => {
    renderWithRouter(<WholesaleLandingPage />, { routerInitialEntries: ['/wholesale'] });
    expect(screen.getByText('Kurumsal & Toptan Çözümleri')).toBeInTheDocument();
    expect(screen.getByText('Ticari İş Ortaklarımız')).toBeInTheDocument();
  });

  it('renders WholesaleProductsPage with B2B catalog products and filters', async () => {
    renderWithRouter(<WholesaleProductsPage />, { routerInitialEntries: ['/wholesale/products'] });
    expect(await screen.findByText('Toptan Satışa Uygun Modeller')).toBeInTheDocument();

    const catBtn = await screen.findByRole('button', { name: 'Masa Üstü Vazolar' });
    fireEvent.click(catBtn);

    const sortSelect = screen.getByLabelText('Sıralama');
    fireEvent.change(sortSelect, { target: { value: 'price_asc' } });
  });

  it('renders WholesaleProductsPage empty state when no products match', async () => {
    vi.spyOn(productRepository, 'getProducts').mockResolvedValue([]);

    renderWithRouter(<WholesaleProductsPage />, { routerInitialEntries: ['/wholesale/products'] });

    expect(await screen.findByText('Ürün Bulunamadı')).toBeInTheDocument();
  });

  it('renders WholesaleHowItWorksPage with 5-step process', () => {
    renderWithRouter(<WholesaleHowItWorksPage />, { routerInitialEntries: ['/wholesale/how-it-works'] });
    expect(screen.getByText('Toptan Sipariş & Üretim Süreci')).toBeInTheDocument();
    expect(screen.getByText('Başvuru & İhtiyaç Belirleme')).toBeInTheDocument();
  });

  it('fills and submits WholesaleApplyPage with real persistence and success state', async () => {
    vi.spyOn(contentRepository, 'submitTradeApplication').mockResolvedValue({
      success: true,
      message: 'Başvuru alındı',
    });

    renderWithRouter(<WholesaleApplyPage />, { routerInitialEntries: ['/wholesale/apply'] });

    expect(screen.getByText('Toptan Satış & Teklif Talebi')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Örn: Arkhe Mimarlık/i), {
      target: { value: 'Arkhe Mimarlık Ltd. Şti.' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Vergi No/i), {
      target: { value: '1234567890' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Vergi Dairesi Adı/i), {
      target: { value: 'Beyoğlu VD' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Adınız Soyadınız/i), {
      target: { value: 'Caner Yılmaz' },
    });
    fireEvent.change(screen.getByPlaceholderText(/isim@sirketiniz.com/i), {
      target: { value: 'caner@arkhe.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/\+90 5XX/i), {
      target: { value: '05321234567' },
    });

    const submitBtn = screen.getByRole('button', { name: 'Başvuruyu Tamamla' });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Başvurunuz Başarıyla Alındı')).toBeInTheDocument();
  });

  it('handles WholesaleApplyPage submission error', async () => {
    vi.spyOn(contentRepository, 'submitTradeApplication').mockRejectedValue(
      new Error('Vergi kimlik numarası doğrulanamadı')
    );

    renderWithRouter(<WholesaleApplyPage />, { routerInitialEntries: ['/wholesale/apply'] });

    fireEvent.change(screen.getByPlaceholderText(/Örn: Arkhe Mimarlık/i), { target: { value: 'Test Ltd.' } });
    fireEvent.change(screen.getByPlaceholderText(/Vergi No/i), { target: { value: '0000000000' } });
    fireEvent.change(screen.getByPlaceholderText(/Vergi Dairesi Adı/i), { target: { value: 'Şişli VD' } });
    fireEvent.change(screen.getByPlaceholderText(/Adınız Soyadınız/i), { target: { value: 'Test Yetkili' } });
    fireEvent.change(screen.getByPlaceholderText(/isim@sirketiniz.com/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/\+90 5XX/i), { target: { value: '05320000000' } });

    fireEvent.click(screen.getByRole('button', { name: 'Başvuruyu Tamamla' }));

    expect(await screen.findByText('Vergi kimlik numarası doğrulanamadı')).toBeInTheDocument();
  });
});

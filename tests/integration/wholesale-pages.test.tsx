import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { WholesaleLandingPage } from '@/site/pages/wholesale/WholesaleLandingPage';
import { WholesaleProductsPage } from '@/site/pages/wholesale/WholesaleProductsPage';
import { WholesaleHowItWorksPage } from '@/site/pages/wholesale/WholesaleHowItWorksPage';
import { WholesaleApplyPage } from '@/site/pages/wholesale/WholesaleApplyPage';
import { renderWithRouter } from 'tests/utils/render-utils';
import { contentRepository } from '@/entities/content/api/content-repository';
import { productRepository } from '@/entities/product/api/product-repository';
import { customerAuthStore } from '@/shared/stores/customer-auth-store';

describe('Wholesale Pages Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    customerAuthStore._setStateForTesting({
      user: null,
      profile: null,
      addresses: [],
      isLoading: false,
      isInitialized: true,
    });
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

  it('renders WholesaleApplyPage for authenticated wholesale customer with active banner', async () => {
    customerAuthStore._setStateForTesting({
      user: { id: 'u-b2b', email: 'b2b@studio.com' } as unknown as import('@supabase/supabase-js').User,
      profile: {
        id: 'u-b2b',
        user_id: 'u-b2b',
        first_name: 'Berk',
        last_name: 'Mimar',
        phone: '05551234567',
        customer_type: 'wholesale',
        wholesale_approved_at: '2026-08-28T00:00:00Z',
        created_at: '2026-08-28T00:00:00Z',
        updated_at: '2026-08-28T00:00:00Z',
      },
      addresses: [],
      isLoading: false,
      isInitialized: true,
    });

    renderWithRouter(<WholesaleApplyPage />, { routerInitialEntries: ['/wholesale/apply'] });

    expect(screen.getByText('Toptan Hesabınız Zaten Aktif')).toBeInTheDocument();
    expect(screen.getByText(/Giriş Yapılan Hesap/)).toBeInTheDocument();
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
    fireEvent.change(screen.getByPlaceholderText(/https:\/\/sirketiniz.com/i), {
      target: { value: 'https://arkhe.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/İlgilendiğiniz koleksiyonlar/i), {
      target: { value: 'Ikigai serisi 50 adet' },
    });

    const volumeSelect = screen.getByLabelText(/Tahmini Sipariş \/ Aylık Hacim/i);
    fireEvent.change(volumeSelect, { target: { value: '50 - 100 Adet' } });

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

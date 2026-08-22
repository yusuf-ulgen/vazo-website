import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { HeroSection } from '@/site/components/home/HeroSection';
import { FeaturedProductsSection } from '@/site/components/home/FeaturedProductsSection';
import { AlternatingEditorialSection } from '@/site/components/home/AlternatingEditorialSection';
import { RetailWholesaleSplitSection } from '@/site/components/home/RetailWholesaleSplitSection';
import { CategoryTilesSection } from '@/site/components/home/CategoryTilesSection';
import { WholesaleBenefitsSection } from '@/site/components/home/WholesaleBenefitsSection';
import { FeaturedCollectionSection } from '@/site/components/home/FeaturedCollectionSection';
import { InspirationStorySection } from '@/site/components/home/InspirationStorySection';
import { NewsletterSection } from '@/site/components/home/NewsletterSection';
import { renderWithRouter } from 'tests/utils/render-utils';
import { contentRepository } from '@/entities/content/api/content-repository';

describe('Homepage Sections', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders HeroSection with title and CTA buttons and toggles wholesale mode', async () => {
    renderWithRouter(<HeroSection />);
    expect(await screen.findByRole('link', { name: /Alışverişe Başla/ })).toBeInTheDocument();

    const wholesaleTab = screen.getByRole('button', { name: 'Toptan' });
    fireEvent.click(wholesaleTab);

    expect(screen.getByRole('link', { name: /Toptan Kataloğu İncele/ })).toBeInTheDocument();
  });

  it('renders FeaturedProductsSection with product grid', async () => {
    renderWithRouter(<FeaturedProductsSection />);
    expect(await screen.findByText('Çok Satan Vazo Modelleri')).toBeInTheDocument();
  });

  it('renders AlternatingEditorialSection with craftsmanship narrative', () => {
    renderWithRouter(<AlternatingEditorialSection />);
    expect(screen.getByText('Yeni Koleksiyon')).toBeInTheDocument();
    expect(screen.getByText('El Yapımı Seramik')).toBeInTheDocument();
  });

  it('renders RetailWholesaleSplitSection with retail and wholesale paths', () => {
    renderWithRouter(<RetailWholesaleSplitSection />);
    expect(screen.getByText('Bireysel Alışveriş')).toBeInTheDocument();
    expect(screen.getByText('Profesyonel & Kurumsal')).toBeInTheDocument();
  });

  it('renders CategoryTilesSection with category cards', async () => {
    renderWithRouter(<CategoryTilesSection />);
    expect(await screen.findByText('Kategorilere Göre Keşfedin')).toBeInTheDocument();
  });

  it('renders WholesaleBenefitsSection with B2B value propositions', async () => {
    renderWithRouter(<WholesaleBenefitsSection />);
    expect(await screen.findByText('Ticari Ortaklarımıza Özel Avantajlar')).toBeInTheDocument();
  });

  it('renders FeaturedCollectionSection', async () => {
    renderWithRouter(<FeaturedCollectionSection />);
    expect(await screen.findByText('Nordik Sessizlik & Amforik Kıvrımlar')).toBeInTheDocument();
  });

  it('renders InspirationStorySection with studio journal excerpt', () => {
    renderWithRouter(<InspirationStorySection />);
    expect(screen.getByText('İlham & Atölye')).toBeInTheDocument();
    expect(screen.getByText('Formun sadeliğinde anlamı bulduk.')).toBeInTheDocument();
  });

  it('submits NewsletterSection form and updates success state only on response', async () => {
    vi.spyOn(contentRepository, 'subscribeNewsletter').mockResolvedValue({
      success: true,
      message: 'Kaydoldunuz',
    });

    renderWithRouter(<NewsletterSection />);

    const input = screen.getByPlaceholderText('E-posta adresiniz...');
    fireEvent.change(input, { target: { value: 'newsletter@example.com' } });

    const submitBtn = screen.getByRole('button', { name: 'Kaydol' });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Stüdyo bültenimize başarıyla kaydoldunuz/)).toBeInTheDocument();
  });

  it('displays NewsletterSection error when subscription fails', async () => {
    vi.spyOn(contentRepository, 'subscribeNewsletter').mockRejectedValue(
      new Error('Bülten servisi yanıt vermiyor')
    );

    renderWithRouter(<NewsletterSection />);

    const input = screen.getByPlaceholderText('E-posta adresiniz...');
    fireEvent.change(input, { target: { value: 'error@example.com' } });

    const submitBtn = screen.getByRole('button', { name: 'Kaydol' });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Bülten servisi yanıt vermiyor')).toBeInTheDocument();
  });
});

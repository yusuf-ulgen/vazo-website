import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { ProductWholesaleTiers } from '@/site/components/pdp/ProductWholesaleTiers';
import { ProductStoryHighlights } from '@/site/components/pdp/ProductStoryHighlights';
import { ProductInspirationGrid } from '@/site/components/pdp/ProductInspirationGrid';
import { ProductAccordions } from '@/site/components/pdp/ProductAccordions';
import { renderWithRouter } from 'tests/utils/render-utils';
import { createWholesaleTier } from 'tests/factories/product.factory';

describe('PDP Supporting Components', () => {
  it('renders ProductWholesaleTiers with custom tiers', () => {
    const tiers = [createWholesaleTier({ minQuantity: 6, maxQuantity: 19, discountPercentage: 25, unitPrice: 1387.5 })];

    renderWithRouter(
      <ProductWholesaleTiers
        tiers={tiers}
        productName="Test Vazo"
        retailPrice={1850}
        productSlug="test-vazo"
      />
    );

    expect(screen.getByText('Toptan Alım / Wholesale')).toBeInTheDocument();
    expect(screen.getByText('6 – 19 adet')).toBeInTheDocument();
    expect(screen.getByText('-%25')).toBeInTheDocument();
  });

  it('renders ProductWholesaleTiers with fallback generated tiers when tiers array is empty', () => {
    renderWithRouter(
      <ProductWholesaleTiers
        tiers={[]}
        productName="Standart Model"
        retailPrice={2000}
        productSlug="standart-model"
      />
    );

    expect(screen.getByText('Toptan Alım / Wholesale')).toBeInTheDocument();
    expect(screen.getByText('6 – 11 adet')).toBeInTheDocument();
    expect(screen.getByText('-%20')).toBeInTheDocument();
    expect(screen.getByText('50+ adet')).toBeInTheDocument();
  });

  it('renders ProductStoryHighlights with handcrafted story blocks', () => {
    renderWithRouter(<ProductStoryHighlights />);

    expect(screen.getByText('Ürün Hikayesi')).toBeInTheDocument();
    expect(screen.getByText('El Yapımı & Zanaat')).toBeInTheDocument();
    expect(screen.getByText('Zamansız Tasarım')).toBeInTheDocument();
  });

  it('renders ProductInspirationGrid with editorial atmosphere imagery', () => {
    renderWithRouter(<ProductInspirationGrid />);

    expect(screen.getByText('Mekan ve Stil İlhamı')).toBeInTheDocument();
    expect(screen.getByText('Kullanım İlhamı')).toBeInTheDocument();
  });

  it('renders ProductAccordions and expands/collapses sections', () => {
    renderWithRouter(<ProductAccordions />);

    const button = screen.getByRole('button', { name: /Teknik Detaylar & Bakım/ });
    expect(button).toBeInTheDocument();

    const secondSectionBtn = screen.getByRole('button', { name: /Kargo, Paketleme & Sevkiyat/ });
    fireEvent.click(secondSectionBtn);

    expect(screen.getByText(/koruyucu ambalajlarla paketlenir/i)).toBeInTheDocument();
  });
});

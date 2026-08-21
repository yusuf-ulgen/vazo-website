import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Menu } from 'lucide-react';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Container } from '@/shared/ui/Container';
import { Divider } from '@/shared/ui/Divider';
import { EditorialHeading } from '@/shared/ui/EditorialHeading';
import { Eyebrow } from '@/shared/ui/Eyebrow';
import { IconButton } from '@/shared/ui/IconButton';
import { PriceDisplay } from '@/shared/ui/PriceDisplay';
import { ProductImage } from '@/shared/ui/ProductImage';
import { Section } from '@/shared/ui/Section';
import { SectionHeader } from '@/shared/ui/SectionHeader';
import * as UIIndex from '@/shared/ui';

describe('Shared UI Primitives', () => {
  it('exports all UI components from index', () => {
    expect(UIIndex.Button).toBeDefined();
    expect(UIIndex.Card).toBeDefined();
    expect(UIIndex.Container).toBeDefined();
  });

  it('renders Badge with custom variants', () => {
    const { rerender } = render(<Badge variant="accent">Yeni</Badge>);
    expect(screen.getByText('Yeni')).toBeInTheDocument();

    rerender(<Badge variant="neutral">Standart</Badge>);
    expect(screen.getByText('Standart')).toBeInTheDocument();
  });

  it('renders Button with variants and handles click events', () => {
    const handleClick = vi.fn();
    const { rerender } = render(
      <Button variant="primary" size="md" onClick={handleClick}>
        Sepete Ekle
      </Button>
    );

    const btn = screen.getByRole('button', { name: 'Sepete Ekle' });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);

    // Variants and sizes
    rerender(<Button variant="secondary" size="sm">İkincil</Button>);
    expect(screen.getByRole('button', { name: 'İkincil' })).toBeInTheDocument();

    rerender(<Button variant="outline" size="lg">Çerçeveli</Button>);
    expect(screen.getByRole('button', { name: 'Çerçeveli' })).toBeInTheDocument();

    rerender(<Button variant="ghost">Hayalet</Button>);
    expect(screen.getByRole('button', { name: 'Hayalet' })).toBeInTheDocument();
  });

  it('renders loading Button and prevents click', () => {
    const handleClick = vi.fn();
    render(<Button isLoading onClick={handleClick}>Yükleniyor Buton</Button>);

    expect(screen.getByText('Yükleniyor...')).toBeInTheDocument();
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders disabled Button and does not trigger clicks', () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Pasif Buton
      </Button>
    );

    const btn = screen.getByRole('button', { name: 'Pasif Buton' });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders Card with content and padding', () => {
    render(<Card padding="lg">Kart İçeriği</Card>);
    expect(screen.getByText('Kart İçeriği')).toBeInTheDocument();
  });

  it('renders Container with custom sizing', () => {
    render(<Container size="md">Konteyner İçeriği</Container>);
    expect(screen.getByText('Konteyner İçeriği')).toBeInTheDocument();
  });

  it('renders Divider element', () => {
    const { container } = render(<Divider />);
    expect(container.firstChild).toHaveClass('border-border-default');
  });

  it('renders EditorialHeading with serif typography and italic subtitle', () => {
    render(
      <EditorialHeading as="h2" size="hero" italicSubtitle="İtalik Alt Başlık">
        Ana Başlık
      </EditorialHeading>
    );
    expect(screen.getByRole('heading', { level: 2, name: /Ana Başlık/ })).toBeInTheDocument();
    expect(screen.getByText('İtalik Alt Başlık')).toBeInTheDocument();
  });

  it('renders Eyebrow with uppercase tracking', () => {
    render(<Eyebrow>Yeni Seri</Eyebrow>);
    expect(screen.getByText('Yeni Seri')).toHaveClass('tracking-editorial');
  });

  it('renders IconButton with accessible label and click handler', () => {
    const handleClick = vi.fn();
    render(
      <IconButton
        icon={Menu}
        label="Menüyü Aç"
        badgeCount={3}
        onClick={handleClick}
      />
    );

    const btn = screen.getByRole('button', { name: 'Menüyü Aç' });
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders PriceDisplay with regular price, discount, and wholesale comparison', () => {
    render(
      <PriceDisplay
        retailPrice={1850}
        compareAtPrice={2200}
        wholesaleUnitPrice={1387.5}
        showVatNote
      />
    );
    expect(screen.getByText(/1\.850/)).toBeInTheDocument();
    expect(screen.getByText(/2\.200/)).toBeInTheDocument();
    expect(screen.getByText('(KDV Dahil)')).toBeInTheDocument();
    expect(screen.getByText(/Toptan Başlangıç Fiyatı/)).toBeInTheDocument();
  });

  it('renders ProductImage with fallback handling on error', () => {
    render(
      <ProductImage
        src="https://example.com/vazo.jpg"
        alt="Örnek Vazo"
        aspectRatio="portrait"
      />
    );
    const img = screen.getByRole('img', { name: 'Örnek Vazo' });
    expect(img).toBeInTheDocument();

    // Trigger error event to test fallback image
    fireEvent.error(img);
    expect(img).toBeInTheDocument();
  });

  it('renders Section and SectionHeader', () => {
    render(
      <Section background="warm">
        <SectionHeader
          eyebrow="Sezonluk"
          title="Zanaat Seçkisi"
          description="Açıklama metni"
        />
      </Section>
    );

    expect(screen.getByText('Sezonluk')).toBeInTheDocument();
    expect(screen.getByText('Zanaat Seçkisi')).toBeInTheDocument();
    expect(screen.getByText('Açıklama metni')).toBeInTheDocument();
  });
});

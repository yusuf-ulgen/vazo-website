import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter } from 'tests/utils/render-utils';
import { LegalConsentStep } from '@/site/checkout/components/LegalConsentStep';
import { AddressSelectionStep } from '@/site/checkout/components/AddressSelectionStep';
import { OrderSummaryStep } from '@/site/checkout/components/OrderSummaryStep';
import { PaymentBoundaryStep } from '@/site/checkout/components/PaymentBoundaryStep';
import { CheckoutQuoteResponse, CreateOrderResponse } from '@/entities/order/types';
import { CustomerAddress } from '@/entities/customer/types';

const mockAddressA: CustomerAddress = {
  id: 'addr-A',
  user_id: 'cust-01',
  label: 'Ev',
  recipient_name: 'Ayşe Yılmaz',
  phone: '5551234567',
  address_line1: 'Karaköy No 1',
  district: 'Beyoğlu',
  city: 'İstanbul',
  country_code: 'TR',
  country_name: 'Türkiye',
  created_at: '2026-08-28T00:00:00Z',
  updated_at: '2026-08-28T00:00:00Z',
};

const mockAddressB: CustomerAddress = {
  id: 'addr-B',
  user_id: 'cust-01',
  label: 'İş',
  recipient_name: 'Mehmet Yılmaz',
  phone: '5559876543',
  address_line1: 'Maslak No 2',
  district: 'Sarıyer',
  city: 'İstanbul',
  country_code: 'TR',
  country_name: 'Türkiye',
  created_at: '2026-08-28T00:00:00Z',
  updated_at: '2026-08-28T00:00:00Z',
};

const mockQuote: CheckoutQuoteResponse = {
  supported: true,
  channel: 'retail',
  currency: 'TRY',
  destination_country: 'TR',
  items: [
    {
      variant_id: 'var-1',
      product_name: 'Alabaster Vazo',
      variant_name: 'Beyaz / Orta',
      image_url: null, // Test fallback image
      unit_price_minor: 150000,
      quantity: 1,
      line_total_minor: 150000,
    },
  ],
  subtotal_minor: 150000,
  shipping_minor: 0,
  free_shipping_applied: true,
  estimated_delivery_text: '1-3 İş Günü',
  discount_minor: 0,
  tax_included: true,
  tax_rate: 20,
  tax_included_minor: 25000,
  total_minor: 150000,
};

const mockOrderResponse: CreateOrderResponse = {
  order_id: 'ord-123',
  order_number: 'VZ-20260828-99999',
  channel: 'retail',
  status: 'pending_payment',
  currency: 'TRY',
  total_minor: 150000,
  tax_included: true,
  expires_at: '2026-08-28T16:00:00Z',
  reservation_timeout_minutes: 40,
  payment_timeout_minutes: 30,
};

describe('Checkout Subcomponents', () => {
  describe('LegalConsentStep', () => {
    it('opens and closes preliminary info modal and distance sales modal', () => {
      const onTogglePrelim = vi.fn();
      const onToggleDist = vi.fn();

      renderWithRouter(
        <LegalConsentStep
          acceptedPreliminaryInfo={false}
          acceptedDistanceSales={false}
          onTogglePreliminaryInfo={onTogglePrelim}
          onToggleDistanceSales={onToggleDist}
        />
      );

      // Open preliminary info modal
      fireEvent.click(screen.getByRole('button', { name: /Ön Bilgilendirme Koşulları'nı/ }));
      expect(screen.getByRole('dialog', { name: 'Ön Bilgilendirme Formu' })).toBeInTheDocument();

      // Close modal
      fireEvent.click(screen.getByRole('button', { name: /Kapat & Devam Et/ }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Open distance sales modal
      fireEvent.click(screen.getByRole('button', { name: /Mesafeli Satış Sözleşmesi'ni/ }));
      expect(screen.getByRole('dialog', { name: 'Mesafeli Satış Sözleşmesi' })).toBeInTheDocument();

      // Close modal with close icon
      fireEvent.click(screen.getByRole('button', { name: 'Kapat' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('AddressSelectionStep', () => {
    it('renders addresses list, handles address selection, and opens add new address modal', async () => {
      const onSelectAddress = vi.fn();

      renderWithRouter(
        <AddressSelectionStep
          title="Teslimat Adresi Seçin"
          description="Açıklama"
          addresses={[mockAddressA, mockAddressB]}
          selectedAddressId="addr-A"
          onSelectAddress={onSelectAddress}
        />
      );

      expect(screen.getByText('Ayşe Yılmaz')).toBeInTheDocument();
      expect(screen.getByText('Mehmet Yılmaz')).toBeInTheDocument();

      // Select second address
      fireEvent.click(screen.getByText('Mehmet Yılmaz'));
      expect(onSelectAddress).toHaveBeenCalledWith(mockAddressB);

      // Open add address modal
      fireEvent.click(screen.getByRole('button', { name: /Yeni Adres Ekle/ }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Cancel / dismiss the modal
      const cancelBtn = screen.queryByRole('button', { name: /İptal/i }) || screen.queryByRole('button', { name: /Kapat/i });
      if (cancelBtn) {
        fireEvent.click(cancelBtn);
        await waitFor(() => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('OrderSummaryStep', () => {
    it('renders order summary with fallback image when image_url is null', () => {
      renderWithRouter(<OrderSummaryStep quote={mockQuote} />);
      expect(screen.getByText('Görsel Yok')).toBeInTheDocument();
      expect(screen.getByText('Ücretsiz Kargo')).toBeInTheDocument();
    });

    it('renders paid shipping when free shipping is not applied and with valid image', () => {
      const paidQuote: CheckoutQuoteResponse = {
        ...mockQuote,
        items: [
          {
            ...mockQuote.items[0],
            image_url: 'https://example.com/item.jpg',
          },
        ],
        shipping_minor: 15000,
        free_shipping_applied: false,
        estimated_delivery_text: null,
      };

      renderWithRouter(<OrderSummaryStep quote={paidQuote} />);
      expect(screen.getByRole('img', { name: 'Alabaster Vazo' })).toBeInTheDocument();
      expect(screen.getByText(/₺150,00/)).toBeInTheDocument();
    });
  });

  describe('PaymentBoundaryStep', () => {
    it('renders created order number, timer, and PayTR frame correctly', async () => {
      renderWithRouter(<PaymentBoundaryStep orderResponse={mockOrderResponse} />);
      expect(await screen.findByText('VZ-20260828-99999')).toBeInTheDocument();
      expect(screen.getByText(/40 dakika/)).toBeInTheDocument();
      expect(await screen.findByTitle('Güvenli PayTR ödeme formu')).toBeInTheDocument();
    });
  });
});

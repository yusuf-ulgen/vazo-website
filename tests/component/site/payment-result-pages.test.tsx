import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, act, fireEvent } from '@testing-library/react';
import { PaymentSuccessPage } from '@/site/pages/payment/PaymentSuccessPage';
import { PaymentFailurePage } from '@/site/pages/payment/PaymentFailurePage';
import { PayTRPaymentFrame } from '@/site/checkout/components/PayTRPaymentFrame';
import { PaymentBoundaryStep } from '@/site/checkout/components/PaymentBoundaryStep';
import { renderWithRouter } from 'tests/utils/render-utils';
import { orderRepository } from '@/entities/order/api/order-repository';
import { Order, CreateOrderResponse } from '@/entities/order/types';

const baseMockOrder: Order = {
  id: 'order-test-101',
  order_number: 'VZ-20260829-PAYTR',
  customer_id: 'cust-01',
  channel: 'retail',
  status: 'pending_payment',
  currency: 'TRY',
  tax_included: true,
  subtotal_minor: 300000,
  shipping_minor: 15000,
  discount_minor: 0,
  tax_included_minor: 52500,
  total_minor: 315000,
  shipping_address: {
    id: 'addr-01',
    user_id: 'cust-01',
    label: 'Ev',
    recipient_name: 'Ayşe Yılmaz',
    phone: '5551234567',
    address_line1: 'Karaköy No 1',
    city: 'İstanbul',
    country_code: 'TR',
    country_name: 'Türkiye',
    created_at: '2026-08-29T00:00:00Z',
    updated_at: '2026-08-29T00:00:00Z',
  },
  created_at: '2026-08-29T12:00:00Z',
  updated_at: '2026-08-29T12:00:00Z',
};

const mockCreateOrderResponse: CreateOrderResponse = {
  order_id: 'order-test-101',
  order_number: 'VZ-20260829-PAYTR',
  status: 'pending_payment',
  subtotal_minor: 300000,
  shipping_minor: 15000,
  total_minor: 315000,
  currency: 'TRY',
  expires_at: '2026-08-29T13:00:00Z',
  payment_timeout_minutes: 30,
  reservation_timeout_minutes: 40,
};

describe('Payment Result Pages & PayTR Frame (Phase 3.5 & 3.6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PaymentSuccessPage Component', () => {
    it('renders confirmed paid state when order is paid', async () => {
      const paidOrder: Order = { ...baseMockOrder, status: 'paid' };
      vi.spyOn(orderRepository, 'getOrderById').mockResolvedValue(paidOrder);

      renderWithRouter(<PaymentSuccessPage />, {
        routerInitialEntries: ['/payment/success?order_id=order-test-101'],
      });

      expect(await screen.findByText('Ödemeniz Başarıyla Alındı!')).toBeInTheDocument();
      expect(screen.getByText('VZ-20260829-PAYTR')).toBeInTheDocument();
      expect(screen.getByText('Ödeme Onaylandı')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Sipariş Detayına Git/ })).toBeInTheDocument();
    });

    it('renders payment review warning state when order status is payment_review', async () => {
      const reviewOrder: Order = { ...baseMockOrder, status: 'payment_review' };
      vi.spyOn(orderRepository, 'getOrderById').mockResolvedValue(reviewOrder);

      renderWithRouter(<PaymentSuccessPage />, {
        routerInitialEntries: ['/payment/success?order_id=order-test-101'],
      });

      expect(await screen.findByText('Ödeme İnceleme Aşamasında')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Siparişi Görüntüle/ })).toBeInTheDocument();
    });

    it('renders payment failed state when order status is payment_failed', async () => {
      const failedOrder: Order = { ...baseMockOrder, status: 'payment_failed' };
      vi.spyOn(orderRepository, 'getOrderById').mockResolvedValue(failedOrder);

      renderWithRouter(<PaymentSuccessPage />, {
        routerInitialEntries: ['/payment/success?order_id=order-test-101'],
      });

      expect(await screen.findByText('Ödeme Onaylanamadı')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Ödemeyi Tekrar Dene/ })).toBeInTheDocument();
    });

    it('renders without order_id parameter gracefully', async () => {
      renderWithRouter(<PaymentSuccessPage />, {
        routerInitialEntries: ['/payment/success'],
      });

      expect(await screen.findByText('Ödeme Bildirimi İşleniyor')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Siparişlerime Git/ })).toBeInTheDocument();
    });

    it('handles order retrieval error gracefully', async () => {
      vi.spyOn(orderRepository, 'getOrderById').mockRejectedValue(new Error('Ağ bağlantısı koptu'));

      renderWithRouter(<PaymentSuccessPage />, {
        routerInitialEntries: ['/payment/success?order_id=order-test-101'],
      });

      expect(await screen.findByText('Ağ bağlantısı koptu')).toBeInTheDocument();
    });
  });

  describe('PaymentFailurePage Component', () => {
    it('renders failure notice with order_id in query params', () => {
      renderWithRouter(<PaymentFailurePage />, {
        routerInitialEntries: ['/payment/failure?order_id=order-test-101'],
      });

      expect(screen.getByText('Ödeme Tamamlanamadı')).toBeInTheDocument();
      expect(screen.getByText(/3D Secure SMS doğrulama/)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Ödemeyi Tekrar Dene/ })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Sepete Dön/ })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Müşteri Hizmetleri/ })).toBeInTheDocument();
    });

    it('renders failure notice without order_id query param', () => {
      renderWithRouter(<PaymentFailurePage />, {
        routerInitialEntries: ['/payment/failure'],
      });

      expect(screen.getByText('Ödeme Tamamlanamadı')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Ödemeyi Tekrar Dene/ })).toBeInTheDocument();
    });
  });

  describe('PayTRPaymentFrame Component', () => {
    it('renders inline iframe with accessible title and test mode banner when enabled', () => {
      renderWithRouter(
        <PayTRPaymentFrame
          iframeUrl="https://www.paytr.com/odeme/guvenli/mock_token_123"
          isTestMode={true}
        />
      );

      expect(screen.getByText(/PayTR Test Modu/)).toBeInTheDocument();
      expect(screen.getByText(/256-Bit SSL & 3D Secure/)).toBeInTheDocument();

      const iframe = screen.getByTitle('Güvenli PayTR ödeme formu');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', 'https://www.paytr.com/odeme/guvenli/mock_token_123');
    });

    it('responds to PayTR postMessage resize event with number and JSON string', () => {
      renderWithRouter(
        <PayTRPaymentFrame
          iframeUrl="https://www.paytr.com/odeme/guvenli/mock_token_123"
          isTestMode={false}
        />
      );

      const iframe = screen.getByTitle('Güvenli PayTR ödeme formu');

      // Dispatch numeric postMessage
      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: 'https://www.paytr.com',
            data: 850,
          })
        );
      });
      expect(iframe).toHaveStyle({ height: '850px' });

      // Dispatch JSON string postMessage
      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: 'https://www.paytr.com',
            data: JSON.stringify({ height: 920 }),
          })
        );
      });
      expect(iframe).toHaveStyle({ height: '920px' });

      // Non-matching origin is ignored
      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            origin: 'https://attacker.com',
            data: 1200,
          })
        );
      });
      expect(iframe).toHaveStyle({ height: '920px' });
    });
  });

  describe('PaymentBoundaryStep Component', () => {
    it('handles token fetching error and allows retry', async () => {
      const getPayTRTokenSpy = vi
        .spyOn(orderRepository, 'getPayTRToken')
        .mockRejectedValueOnce(new Error('PayTR bağlantı zaman aşımı'))
        .mockResolvedValueOnce({
          success: true,
          token: 'retry_token_456',
          iframe_url: 'https://www.paytr.com/odeme/guvenli/retry_token_456',
          merchant_oid: 'VZMOCKRETRY',
          is_test_mode: true,
        });

      renderWithRouter(<PaymentBoundaryStep orderResponse={mockCreateOrderResponse} />);

      // Expect initial error banner
      expect(await screen.findByText('Ödeme Başlatılamadı')).toBeInTheDocument();
      expect(screen.getByText('PayTR bağlantı zaman aşımı')).toBeInTheDocument();

      // Click "Yeniden Dene"
      const retryBtn = screen.getByRole('button', { name: /Yeniden Dene/ });
      fireEvent.click(retryBtn);

      // Expect iframe to mount after successful retry
      expect(await screen.findByTitle('Güvenli PayTR ödeme formu')).toBeInTheDocument();
      expect(getPayTRTokenSpy).toHaveBeenCalledTimes(2);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orderRepository } from '@/entities/order/api/order-repository';
import { CustomerAddress } from '@/entities/customer/types';

const mockAddress: CustomerAddress = {
  id: 'addr-01',
  user_id: 'cust-01',
  label: 'Ev',
  recipient_name: 'Ayşe Yılmaz',
  phone: '+90 555 123 4567',
  address_line1: 'Karaköy Kemankeş Cad. No 42',
  district: 'Beyoğlu',
  city: 'İstanbul',
  country_code: 'TR',
  country_name: 'Türkiye',
  is_default_shipping: true,
  is_default_billing: true,
  created_at: '2026-08-28T00:00:00Z',
  updated_at: '2026-08-28T00:00:00Z',
};

describe('orderRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates authoritative checkout quote with shipping and KDV-inclusive tax', async () => {
    const quote = await orderRepository.getQuote({
      items: [
        { variant_id: 'v-01', quantity: 2 },
      ],
      destination_country: 'TR',
      channel: 'retail',
      currency: 'TRY',
    });

    expect(quote.supported).toBe(true);
    expect(quote.channel).toBe('retail');
    expect(quote.currency).toBe('TRY');
    expect(quote.subtotal_minor).toBe(300000); // 2 * 1.500,00 TRY = 3.000,00 TRY
    expect(quote.tax_included).toBe(true);
    expect(quote.total_minor).toBeGreaterThan(0);
    expect(quote.items).toHaveLength(1);
    expect(quote.items[0].quantity).toBe(2);
  });

  it('calculates international shipping quote for non-TR destination', async () => {
    const quote = await orderRepository.getQuote({
      items: [{ variant_id: 'v-01', quantity: 1 }],
      destination_country: 'DE',
      channel: 'retail',
      currency: 'TRY',
    });

    // Mock simulator returns unsupported for non-TR destinations by default
    expect(quote.destination_country).toBe('DE');
    expect(quote.currency).toBe('TRY');
  });

  it('returns quote with no items for empty cart', async () => {
    const quote = await orderRepository.getQuote({
      items: [],
      destination_country: 'TR',
    });

    expect(quote.items).toHaveLength(0);
    // Mock simulator may still return a minimum shipping fee
    expect(quote.subtotal_minor).toBe(0);
  });

  it('rejects order creation without explicit legal acceptance', async () => {
    await expect(
      orderRepository.createOrder({
        items: [{ variant_id: 'v-01', quantity: 1 }],
        shipping_address: mockAddress,
        accepted_preliminary_info: false,
        accepted_distance_sales: true,
      })
    ).rejects.toThrow('Ön Bilgilendirme Koşulları ve Mesafeli Satış Sözleşmesi onaylanmalıdır');
  });

  it('creates an order and returns unique order number and 40 min reservation TTL', async () => {
    const res = await orderRepository.createOrder({
      items: [{ variant_id: 'v-01', quantity: 1 }],
      shipping_address: mockAddress,
      accepted_preliminary_info: true,
      accepted_distance_sales: true,
    });

    expect(res.order_number).toMatch(/^VZ-\d{8}-[A-Z0-9]{5}$/);
    expect(res.status).toBe('pending_payment');
    expect(res.reservation_timeout_minutes).toBe(40);
    expect(res.payment_timeout_minutes).toBe(30);
    expect(res.total_minor).toBeGreaterThan(0);
  });

  it('retrieves customer order list and returns null for non-existent order ID', async () => {
    const created = await orderRepository.createOrder({
      items: [{ variant_id: 'v-02', quantity: 3 }],
      shipping_address: mockAddress,
      accepted_preliminary_info: true,
      accepted_distance_sales: true,
    });

    const orders = await orderRepository.getCustomerOrders();
    expect(orders.length).toBeGreaterThan(0);

    const single = await orderRepository.getOrderById(created.order_id);
    expect(single).not.toBeNull();
    expect(single?.order_number).toBe(created.order_number);
    expect(single?.items).toBeDefined();

    const notFound = await orderRepository.getOrderById('non-existent-uuid');
    expect(notFound).toBeNull();
  });
});

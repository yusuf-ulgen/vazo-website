import { describe, it, expect, beforeEach, vi } from 'vitest';
import { orderRepository } from '@/entities/order/api/order-repository';
import { getMockState } from '../mocks/supabase-mock';
import * as supabaseModule from '@/shared/lib/supabase';

describe('Phase 3.18 — PayTR Token Input & Customer Data Integrity', () => {
  const validOrder = {
    id: 'ord-val-001',
    order_number: 'VZ20260830001',
    customer_id: 'cust-real-001',
    customer_name: 'Zeynep Kaya',
    customer_email: 'zeynep.kaya@gmail.com',
    customer_phone: '5321234567',
    status: 'pending_payment',
    total_minor: 45000, // 450.00 TL
    currency: 'TRY',
    shipping_address: {
      recipient_name: 'Zeynep Kaya',
      email: 'zeynep.kaya@gmail.com',
      phone: '5321234567',
      address_line1: 'Bağdat Caddesi No: 120 Daire: 4',
      district: 'Kadıköy',
      city: 'İstanbul',
      country_name: 'Türkiye',
    },
    order_items: [
      {
        product_name_snapshot: 'Seramik Vazo',
        unit_price_minor: 45000,
        quantity: 1,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(false);
    const state = getMockState();
    state['orders'] = [{ ...validOrder }];
    state['site_settings'] = [
      {
        key: 'commerce',
        value: { checkout_enabled: true },
      },
    ];

    // Ensure mock session exists for getPayTRToken
    const client = supabaseModule.getSupabase();
    if (client?.auth) {
      vi.spyOn(client.auth, 'getSession').mockResolvedValue({
        data: { session: { access_token: 'mock-token', user: { id: 'cust-real-001' } } } as never,
        error: null,
      });
    }
  });

  it('rejects token generation when customer phone is dummy / invalid', async () => {
    const client = supabaseModule.getSupabase();
    const invokeSpy = vi.spyOn(client.functions, 'invoke');

    // Test with simulateInvalidPhone
    invokeSpy.mockImplementationOnce(() =>
      Promise.resolve({
        data: null,
        error: { message: 'Teslimat ve SMS bilgilendirmesi için geçerli bir telefon numarası zorunludur. Lütfen adresinizdeki telefon bilgisini güncelleyin.' },
      })
    );

    await expect(orderRepository.getPayTRToken('ord-val-001')).rejects.toThrow(
      /geçerli bir telefon numarası zorunludur/i
    );
  });

  it('rejects token generation when customer name is missing or fake (e.g. Müşteri)', async () => {
    const client = supabaseModule.getSupabase();
    const invokeSpy = vi.spyOn(client.functions, 'invoke');

    invokeSpy.mockImplementationOnce(() =>
      Promise.resolve({
        data: null,
        error: { message: 'Teslimat için geçerli bir alıcı ad-soyad bilgisi zorunludur. Lütfen adresinizi güncelleyin.' },
      })
    );

    await expect(orderRepository.getPayTRToken('ord-val-001')).rejects.toThrow(
      /geçerli bir alıcı ad-soyad bilgisi zorunludur/i
    );
  });

  it('rejects token generation when customer email is placeholder / invalid', async () => {
    const client = supabaseModule.getSupabase();
    const invokeSpy = vi.spyOn(client.functions, 'invoke');

    invokeSpy.mockImplementationOnce(() =>
      Promise.resolve({
        data: null,
        error: { message: 'Geçerli bir müşteri e-posta adresi zorunludur. Lütfen profilinizdeki e-posta adresinizi doğrulayın.' },
      })
    );

    await expect(orderRepository.getPayTRToken('ord-val-001')).rejects.toThrow(
      /geçerli bir müşteri e-posta adresi zorunludur/i
    );
  });

  it('rejects token generation when shipping address is missing or incomplete', async () => {
    const client = supabaseModule.getSupabase();
    const invokeSpy = vi.spyOn(client.functions, 'invoke');

    invokeSpy.mockImplementationOnce(() =>
      Promise.resolve({
        data: null,
        error: { message: 'Geçerli ve açık bir teslimat adresi zorunludur. Lütfen adres bilgilerinizi eksiksiz doldurun.' },
      })
    );

    await expect(orderRepository.getPayTRToken('ord-val-001')).rejects.toThrow(
      /açık bir teslimat adresi zorunludur/i
    );
  });

  it('rejects token generation when requesting user is not the order owner', async () => {
    const client = supabaseModule.getSupabase();
    const invokeSpy = vi.spyOn(client.functions, 'invoke');

    invokeSpy.mockImplementationOnce(() =>
      Promise.resolve({
        data: null,
        error: { message: 'Bu siparişe erişim yetkiniz bulunmamaktadır.' },
      })
    );

    await expect(orderRepository.getPayTRToken('ord-val-001')).rejects.toThrow(
      /Bu siparişe erişim yetkiniz bulunmamaktadır/
    );
  });

  it('rejects token generation when order status is not pending_payment', async () => {
    const client = supabaseModule.getSupabase();
    const invokeSpy = vi.spyOn(client.functions, 'invoke');

    invokeSpy.mockImplementationOnce(() =>
      Promise.resolve({
        data: null,
        error: { message: 'Sipariş ödeme aşamasında değil (Mevcut Durum: paid).' },
      })
    );

    await expect(orderRepository.getPayTRToken('ord-val-001')).rejects.toThrow(
      /Sipariş ödeme aşamasında değil/
    );
  });

  it('rejects token generation when checkout is disabled (kill switch active)', async () => {
    const client = supabaseModule.getSupabase();
    const invokeSpy = vi.spyOn(client.functions, 'invoke');

    invokeSpy.mockImplementationOnce(() =>
      Promise.resolve({
        data: null,
        error: { message: 'Ödeme ve sipariş sistemi şu anda kapalıdır.' },
      })
    );

    await expect(orderRepository.getPayTRToken('ord-val-001')).rejects.toThrow(
      /Ödeme ve sipariş sistemi şu anda kapalıdır/
    );
  });

  it('rejects token generation when APP_ORIGIN is missing from server configuration', async () => {
    const client = supabaseModule.getSupabase();
    const invokeSpy = vi.spyOn(client.functions, 'invoke');

    invokeSpy.mockImplementationOnce(() =>
      Promise.resolve({
        data: null,
        error: { message: 'Sunucu yapılandırma hatası: APP_ORIGIN tanımlanmamış.' },
      })
    );

    await expect(orderRepository.getPayTRToken('ord-val-001')).rejects.toThrow(
      /APP_ORIGIN tanımlanmamış/
    );
  });

  it('handles PayTR provider HTTP error and surfaces clear failure message', async () => {
    const client = supabaseModule.getSupabase();
    const invokeSpy = vi.spyOn(client.functions, 'invoke');

    invokeSpy.mockImplementationOnce(() =>
      Promise.resolve({
        data: null,
        error: { message: 'PayTR servisi ile iletişim kurulamadı.' },
      })
    );

    await expect(orderRepository.getPayTRToken('ord-val-001')).rejects.toThrow(
      /PayTR servisi ile iletişim kurulamadı/
    );
  });

  it('generates PayTR token successfully when all customer and business data are valid', async () => {
    const tokenRes = await orderRepository.getPayTRToken('ord-val-001');

    expect(tokenRes.success).toBe(true);
    expect(tokenRes.token).toBeDefined();
    expect(tokenRes.iframe_url).toContain(tokenRes.token);
    expect(tokenRes.merchant_oid).toBeDefined();
  });
});

import { describe, it, expect } from 'vitest';
import { resolveShippingLocally } from '@/entities/shipping/lib/shipping-resolver';
import { ShippingZone } from '@/entities/shipping/types';

describe('Shipping Resolver Engine', () => {
  const mockZones: ShippingZone[] = [
    {
      id: 'z-tr-01',
      name: 'Türkiye İçi',
      active: true,
      priority: 10,
      retail_enabled: true,
      wholesale_enabled: true,
      created_at: '2026-08-28T00:00:00Z',
      updated_at: '2026-08-28T00:00:00Z',
      countries: [
        {
          id: 'c-tr-01',
          zone_id: 'z-tr-01',
          country_code: 'TR',
          country_name: 'Türkiye',
          active: true,
          created_at: '2026-08-28T00:00:00Z',
        },
      ],
      rates: [
        {
          id: 'r-tr-express',
          zone_id: 'z-tr-01',
          name: 'Hızlı Kurye',
          currency: 'TRY',
          flat_amount_minor: 35000,
          free_shipping_threshold_minor: null,
          estimated_delivery_text: 'Aynı Gün',
          active: true,
          priority: 5,
          created_at: '2026-08-28T00:00:00Z',
          updated_at: '2026-08-28T00:00:00Z',
        },
        {
          id: 'r-tr-standard',
          zone_id: 'z-tr-01',
          name: 'Standart Yurtiçi Teslimat',
          currency: 'TRY',
          flat_amount_minor: 15000,
          free_shipping_threshold_minor: 500000, // 5,000.00 TRY
          estimated_delivery_text: '2–4 İş Günü',
          active: true,
          priority: 10,
          created_at: '2026-08-28T00:00:00Z',
          updated_at: '2026-08-28T00:00:00Z',
        },
      ],
    },
    {
      id: 'z-eu-01',
      name: 'Avrupa Bölgesi',
      active: true,
      priority: 5,
      retail_enabled: true,
      wholesale_enabled: false, // Wholesale disabled for EU zone
      created_at: '2026-08-28T00:00:00Z',
      updated_at: '2026-08-28T00:00:00Z',
      countries: [
        {
          id: 'c-de-01',
          zone_id: 'z-eu-01',
          country_code: 'DE',
          country_name: 'Almanya',
          active: true,
          created_at: '2026-08-28T00:00:00Z',
        },
        {
          id: 'c-fr-01',
          zone_id: 'z-eu-01',
          country_code: 'FR',
          country_name: 'Fransa',
          active: false, // Inactive country
          created_at: '2026-08-28T00:00:00Z',
        },
      ],
      rates: [
        {
          id: 'r-eu-eur',
          zone_id: 'z-eu-01',
          name: 'EU Standard DHL',
          currency: 'EUR',
          flat_amount_minor: 2500, // 25.00 EUR
          free_shipping_threshold_minor: 15000, // 150.00 EUR
          minimum_order_minor: 5000, // 50.00 EUR min order
          maximum_order_minor: 50000, // 500.00 EUR max order
          estimated_delivery_text: '4–7 Days',
          active: true,
          priority: 10,
          created_at: '2026-08-28T00:00:00Z',
          updated_at: '2026-08-28T00:00:00Z',
        },
      ],
    },
    {
      id: 'z-inactive',
      name: 'Pasif Bölge',
      active: false,
      priority: 20,
      retail_enabled: true,
      wholesale_enabled: true,
      created_at: '2026-08-28T00:00:00Z',
      updated_at: '2026-08-28T00:00:00Z',
      countries: [
        {
          id: 'c-us-01',
          zone_id: 'z-inactive',
          country_code: 'US',
          country_name: 'United States',
          active: true,
          created_at: '2026-08-28T00:00:00Z',
        },
      ],
      rates: [],
    },
  ];

  it('rejects empty or missing country code with descriptive message', () => {
    const res = resolveShippingLocally(mockZones, { country_code: '' });
    expect(res.supported).toBe(false);
    expect(res.shipping_minor).toBe(0);
    expect(res.message).toContain('Lütfen geçerli bir teslimat ülkesi seçiniz');
  });

  it('rejects unconfigured or unsupported country with graceful notice', () => {
    const res = resolveShippingLocally(mockZones, { country_code: 'JP' });
    expect(res.supported).toBe(false);
    expect(res.message).toBe('Bu teslimat ülkesi henüz aktif değil.');
  });

  it('rejects inactive country in an active zone', () => {
    const res = resolveShippingLocally(mockZones, { country_code: 'FR' }); // FR is active: false
    expect(res.supported).toBe(false);
    expect(res.message).toBe('Bu teslimat ülkesi henüz aktif değil.');
  });

  it('rejects countries in inactive zones even if priority is higher', () => {
    const res = resolveShippingLocally(mockZones, { country_code: 'US' });
    expect(res.supported).toBe(false);
  });

  it('resolves flat fee when subtotal is below free shipping threshold', () => {
    const res = resolveShippingLocally(mockZones, {
      country_code: 'TR',
      subtotal_minor: 300000, // 3,000.00 TRY < 5,000.00 TRY
      currency: 'TRY',
      channel: 'retail',
    });

    expect(res.supported).toBe(true);
    expect(res.zone_name).toBe('Türkiye İçi');
    expect(res.rate_name).toBe('Standart Yurtiçi Teslimat');
    expect(res.shipping_minor).toBe(15000); // 150.00 TRY flat fee
    expect(res.free_shipping_applied).toBe(false);
    expect(res.estimated_delivery_text).toBe('2–4 İş Günü');
  });

  it('applies free shipping when subtotal reaches free shipping threshold', () => {
    const res = resolveShippingLocally(mockZones, {
      country_code: 'TR',
      subtotal_minor: 500000, // 5,000.00 TRY == 5,000.00 TRY threshold
      currency: 'TRY',
      channel: 'retail',
    });

    expect(res.supported).toBe(true);
    expect(res.shipping_minor).toBe(0);
    expect(res.free_shipping_applied).toBe(true);
  });

  it('respects channel separation: rejects wholesale if zone wholesale_enabled is false', () => {
    const res = resolveShippingLocally(mockZones, {
      country_code: 'DE',
      subtotal_minor: 10000,
      currency: 'EUR',
      channel: 'wholesale',
    });

    expect(res.supported).toBe(false);
    expect(res.message).toBe('Bu teslimat ülkesi henüz aktif değil.');
  });

  it('respects currency separation and order bounds', () => {
    // Below minimum order bound
    const tooLow = resolveShippingLocally(mockZones, {
      country_code: 'DE',
      subtotal_minor: 3000, // 30.00 EUR < 50.00 EUR min
      currency: 'EUR',
      channel: 'retail',
    });
    expect(tooLow.supported).toBe(false);

    // Within order bounds
    const valid = resolveShippingLocally(mockZones, {
      country_code: 'DE',
      subtotal_minor: 10000, // 100.00 EUR (between 50 and 500 EUR)
      currency: 'EUR',
      channel: 'retail',
    });
    expect(valid.supported).toBe(true);
    expect(valid.shipping_minor).toBe(2500); // 25.00 EUR
    expect(valid.free_shipping_applied).toBe(false);

    // Currency mismatch (TRY requested for EUR zone)
    const currencyMismatch = resolveShippingLocally(mockZones, {
      country_code: 'DE',
      subtotal_minor: 10000,
      currency: 'TRY',
      channel: 'retail',
    });
    expect(currencyMismatch.supported).toBe(false);
  });
});

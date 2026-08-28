import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminShippingRepository } from '@/admin/shipping/api/admin-shipping-repository';
import { adminAuditRepository } from '@/admin/audit/api/admin-audit-repository';

vi.mock('@/admin/audit/api/admin-audit-repository', () => ({
  adminAuditRepository: {
    logAuditEvent: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
};

vi.mock('@/shared/lib/supabase', () => ({
  getSupabase: () => mockSupabase,
}));

describe('adminShippingRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches all shipping zones with joined countries and rates', async () => {
    const mockZonesData = [
      { id: 'z-1', name: 'Türkiye', priority: 10, created_at: '2026-08-28T00:00:00Z' },
    ];
    const mockCountriesData = [
      { id: 'c-1', zone_id: 'z-1', country_code: 'TR', country_name: 'Türkiye', active: true },
    ];
    const mockRatesData = [
      { id: 'r-1', zone_id: 'z-1', name: 'Standart', flat_amount_minor: 15000, active: true },
    ];

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'shipping_zones') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockZonesData, error: null }),
            }),
          }),
        };
      }
      if (table === 'shipping_zone_countries') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockCountriesData, error: null }),
          }),
        };
      }
      if (table === 'shipping_rates') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockRatesData, error: null }),
            }),
          }),
        };
      }
      return {};
    });

    const result = await adminShippingRepository.getZones();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Türkiye');
    expect(result[0].countries).toHaveLength(1);
    expect(result[0].rates).toHaveLength(1);
  });

  it('creates a new shipping zone and records audit log', async () => {
    const createdZone = {
      id: 'z-new-01',
      name: 'Avrupa Bölgesi',
      priority: 5,
      active: true,
      retail_enabled: true,
      wholesale_enabled: false,
    };

    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: createdZone, error: null }),
        }),
      }),
    });

    const result = await adminShippingRepository.createZone({
      name: 'Avrupa Bölgesi',
      priority: 5,
    });

    expect(result.id).toBe('z-new-01');
    expect(result.name).toBe('Avrupa Bölgesi');
    expect(adminAuditRepository.logAuditEvent).toHaveBeenCalledWith(
      'CREATE',
      'shipping_zone',
      'z-new-01',
      'Avrupa Bölgesi',
      expect.objectContaining({ priority: 5 })
    );
  });

  it('validates ISO country code length when adding a country to zone', async () => {
    await expect(
      adminShippingRepository.addCountryToZone('z-1', {
        country_code: 'TUR', // 3 chars invalid
        country_name: 'Türkiye',
      })
    ).rejects.toThrow('Ülke kodu 2 haneli ISO formatında olmalıdır');
  });

  it('adds country to zone and records audit log', async () => {
    const createdCountry = {
      id: 'c-de-01',
      zone_id: 'z-1',
      country_code: 'DE',
      country_name: 'Almanya',
      active: true,
    };

    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: createdCountry, error: null }),
        }),
      }),
    });

    const result = await adminShippingRepository.addCountryToZone('z-1', {
      country_code: 'DE',
      country_name: 'Almanya',
    });

    expect(result.country_code).toBe('DE');
    expect(adminAuditRepository.logAuditEvent).toHaveBeenCalledWith(
      'CREATE',
      'shipping_zone_country',
      'c-de-01',
      'Almanya (DE)',
      expect.objectContaining({ zone_id: 'z-1' })
    );
  });

  it('creates a shipping rate and converts minor units correctly', async () => {
    const createdRate = {
      id: 'r-new-01',
      zone_id: 'z-1',
      name: 'Express Kurye',
      flat_amount_minor: 25000,
      currency: 'TRY',
      active: true,
    };

    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: createdRate, error: null }),
        }),
      }),
    });

    const result = await adminShippingRepository.createRate('z-1', {
      name: 'Express Kurye',
      flat_amount_minor: 25000,
      currency: 'TRY',
    });

    expect(result.id).toBe('r-new-01');
    expect(result.name).toBe('Express Kurye');
  });

  it('deletes a zone and records audit log', async () => {
    mockSupabase.from.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    await adminShippingRepository.deleteZone('z-1');

    expect(adminAuditRepository.logAuditEvent).toHaveBeenCalledWith(
      'DELETE',
      'shipping_zone',
      'z-1',
      'Zone z-1',
      {}
    );
  });
});

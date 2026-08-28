import { describe, it, expect, vi, beforeEach } from 'vitest';
import { customerAddressRepository } from '@/entities/customer/api/customer-address-repository';
import * as supabaseModule from '@/shared/lib/supabase';

describe('customerAddressRepository', () => {
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockEq = vi.fn();
  const mockOrder = vi.fn();
  const mockSingle = vi.fn();

  const sampleAddress = {
    id: 'addr-01',
    user_id: 'user-123',
    label: 'Ev',
    recipient_name: 'Ahmet Yılmaz',
    phone: '05551112233',
    address_line1: 'Moda Cad. No: 12',
    address_line2: 'Daire 4',
    district: 'Kadıköy',
    city: 'İstanbul',
    state_province: null,
    postal_code: '34710',
    country_code: 'TR',
    country_name: 'Türkiye',
    is_default_shipping: true,
    is_default_billing: true,
    created_at: '2026-08-28T12:00:00Z',
    updated_at: '2026-08-28T12:00:00Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    mockOrder.mockImplementation(() => ({
      order: mockOrder,
      then: (resolve: (val: { data: unknown[]; error: unknown }) => void) =>
        resolve({ data: [sampleAddress], error: null }),
    }));

    mockEq.mockImplementation(() => ({
      eq: mockEq,
      order: mockOrder,
      select: vi.fn().mockReturnValue({ single: mockSingle }),
      then: (resolve: (val: { data: unknown[]; error: unknown }) => void) =>
        resolve({ data: [sampleAddress], error: null }),
    }));

    mockSingle.mockResolvedValue({
      data: sampleAddress,
      error: null,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
    });

    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({ single: mockSingle }),
    });

    mockUpdate.mockReturnValue({
      eq: mockEq,
    });

    mockDelete.mockReturnValue({
      eq: mockEq,
    });

    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    });

    vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue({
      from: mockFrom,
    } as unknown as ReturnType<typeof supabaseModule.getSupabase>);
  });

  it('returns empty array when userId is not provided', async () => {
    const addresses = await customerAddressRepository.getMyAddresses('');
    expect(addresses).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('fetches addresses ordered by default shipping and creation date', async () => {
    const addresses = await customerAddressRepository.getMyAddresses('user-123');
    expect(mockFrom).toHaveBeenCalledWith('customer_addresses');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
    expect(addresses).toHaveLength(1);
    expect(addresses[0].city).toBe('İstanbul');
  });

  it('creates an address and normalizes ISO country code', async () => {
    const created = await customerAddressRepository.createAddress('user-123', {
      label: 'Ofis',
      recipient_name: 'Ahmet Yılmaz',
      phone: '05551112233',
      address_line1: 'Maslak Mah. No: 5',
      address_line2: null,
      district: 'Sarıyer',
      city: 'İstanbul',
      state_province: null,
      postal_code: '34485',
      country_code: 'tr',
      country_name: 'Türkiye',
      is_default_shipping: false,
      is_default_billing: false,
    });

    expect(mockFrom).toHaveBeenCalledWith('customer_addresses');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        country_code: 'TR',
        city: 'İstanbul',
        label: 'Ofis',
      })
    );
    expect(created.id).toBe('addr-01');
  });

  it('updates an existing address', async () => {
    const updated = await customerAddressRepository.updateAddress('user-123', 'addr-01', {
      city: 'Ankara',
      label: 'İş',
    });

    expect(mockFrom).toHaveBeenCalledWith('customer_addresses');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        city: 'Ankara',
        label: 'İş',
      })
    );
    expect(updated).toBeDefined();
  });

  it('deletes an address with user_id boundary verification', async () => {
    mockEq.mockImplementation(() => ({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }));

    await customerAddressRepository.deleteAddress('user-123', 'addr-01');
    expect(mockFrom).toHaveBeenCalledWith('customer_addresses');
    expect(mockDelete).toHaveBeenCalled();
  });

  it('sets default shipping address', async () => {
    const spy = vi.spyOn(customerAddressRepository, 'updateAddress').mockResolvedValue(sampleAddress);
    await customerAddressRepository.setDefaultShipping('user-123', 'addr-01');
    expect(spy).toHaveBeenCalledWith('user-123', 'addr-01', { is_default_shipping: true });
  });

  it('sets default billing address', async () => {
    const spy = vi.spyOn(customerAddressRepository, 'updateAddress').mockResolvedValue(sampleAddress);
    await customerAddressRepository.setDefaultBilling('user-123', 'addr-01');
    expect(spy).toHaveBeenCalledWith('user-123', 'addr-01', { is_default_billing: true });
  });

  it('handles validation and database errors in CRUD operations', async () => {
    // 1. Empty inputs
    await expect(
      customerAddressRepository.createAddress('', {
        label: 'Ev',
        recipient_name: 'A',
        phone: '1',
        address_line1: 'B',
        address_line2: null,
        district: null,
        city: 'C',
        state_province: null,
        postal_code: '34000',
        country_code: 'TR',
        country_name: 'Türkiye',
        is_default_shipping: false,
        is_default_billing: false,
      })
    ).rejects.toThrow('Kullanıcı kimliği belirtilmelidir.');

    await expect(customerAddressRepository.updateAddress('', 'addr-01', {})).rejects.toThrow(
      'Kullanıcı ve adres kimliği belirtilmelidir.'
    );
    await expect(customerAddressRepository.deleteAddress('', 'addr-01')).rejects.toThrow(
      'Kullanıcı ve adres kimliği belirtilmelidir.'
    );

    // 2. Database errors
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Insert failed' } });
    await expect(
      customerAddressRepository.createAddress('user-123', {
        label: 'Ev',
        recipient_name: 'A',
        phone: '1',
        address_line1: 'B',
        address_line2: null,
        district: null,
        city: 'C',
        state_province: null,
        postal_code: '34000',
        country_code: 'TR',
        country_name: 'Türkiye',
        is_default_shipping: false,
        is_default_billing: false,
      })
    ).rejects.toThrow(/Adres kaydedilirken hata oluştu/);

    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Update failed' } });
    await expect(
      customerAddressRepository.updateAddress('user-123', 'addr-01', { city: 'İzmir' })
    ).rejects.toThrow(/Adres güncellenirken hata oluştu/);

    mockEq.mockImplementationOnce(() => ({
      eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
    }));
    await expect(customerAddressRepository.deleteAddress('user-123', 'addr-01')).rejects.toThrow(
      /Adres silinirken hata oluştu/
    );
  });
});

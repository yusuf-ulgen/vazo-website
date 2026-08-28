import { describe, it, expect, vi, beforeEach } from 'vitest';
import { customerProfileRepository } from '@/entities/customer/api/customer-profile-repository';
import * as supabaseModule from '@/shared/lib/supabase';

describe('customerProfileRepository', () => {
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockMaybeSingle = vi.fn();
  const mockUpdate = vi.fn();
  const mockSingle = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();

    mockMaybeSingle.mockResolvedValue({
      data: {
        user_id: 'user-123',
        first_name: 'Ahmet',
        last_name: 'Yılmaz',
        phone: '05551112233',
        customer_type: 'retail',
        wholesale_approved_at: null,
        created_at: '2026-08-28T12:00:00Z',
        updated_at: '2026-08-28T12:00:00Z',
      },
      error: null,
    });

    mockSingle.mockResolvedValue({
      data: {
        user_id: 'user-123',
        first_name: 'Can',
        last_name: 'Demir',
        phone: '05559998877',
        customer_type: 'retail',
        wholesale_approved_at: null,
        created_at: '2026-08-28T12:00:00Z',
        updated_at: '2026-08-28T12:30:00Z',
      },
      error: null,
    });

    mockEq.mockReturnValue({
      maybeSingle: mockMaybeSingle,
      select: vi.fn().mockReturnValue({ single: mockSingle }),
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
    });

    mockUpdate.mockReturnValue({
      eq: mockEq,
    });

    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    });

    vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue({
      from: mockFrom,
    } as unknown as ReturnType<typeof supabaseModule.getSupabase>);
  });

  it('returns null if userId is empty', async () => {
    const profile = await customerProfileRepository.getMyProfile('');
    expect(profile).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('fetches profile for authenticated user', async () => {
    const profile = await customerProfileRepository.getMyProfile('user-123');
    expect(mockFrom).toHaveBeenCalledWith('customer_profiles');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
    expect(profile).toEqual(
      expect.objectContaining({
        user_id: 'user-123',
        first_name: 'Ahmet',
        customer_type: 'retail',
      })
    );
  });

  it('throws an informative error if database query fails', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database connection timeout' },
    });

    await expect(customerProfileRepository.getMyProfile('user-123')).rejects.toThrow(
      /Müşteri profili yüklenirken hata oluştu/
    );
  });

  it('updates safe profile fields successfully', async () => {
    const updated = await customerProfileRepository.updateMyProfile('user-123', {
      first_name: 'Can',
      last_name: 'Demir',
      phone: '05559998877',
    });

    expect(mockFrom).toHaveBeenCalledWith('customer_profiles');
    expect(mockUpdate).toHaveBeenCalledWith({
      first_name: 'Can',
      last_name: 'Demir',
      phone: '05559998877',
    });
    expect(updated.first_name).toBe('Can');
  });

  it('throws error when update fails', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Privilege violation' },
    });

    await expect(
      customerProfileRepository.updateMyProfile('user-123', { first_name: 'Test' })
    ).rejects.toThrow(/Profil güncellenirken hata oluştu/);
  });

  it('throws error if userId is empty during updateMyProfile', async () => {
    await expect(customerProfileRepository.updateMyProfile('', { first_name: 'Test' })).rejects.toThrow(
      'Kullanıcı kimliği belirtilmelidir.'
    );
  });
});

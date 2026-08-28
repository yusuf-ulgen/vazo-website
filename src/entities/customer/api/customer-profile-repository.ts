import { getSupabase } from '@/shared/lib/supabase';
import type { CustomerProfile, UpdateProfileInput } from '../types';

export const customerProfileRepository = {
  /**
   * Fetches the profile of the currently authenticated customer.
   */
  async getMyProfile(userId: string): Promise<CustomerProfile | null> {
    if (!userId) return null;
    const client = getSupabase();
    const { data, error } = await client
      .from('customer_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Müşteri profili yüklenirken hata oluştu: ${error.message}`);
    }

    return (data as CustomerProfile) || null;
  },

  /**
   * Updates self-service customer profile fields (first_name, last_name, phone).
   * Note: Privileged fields (customer_type, wholesale_approved_at) are blocked at DB level.
   */
  async updateMyProfile(userId: string, input: UpdateProfileInput): Promise<CustomerProfile> {
    if (!userId) throw new Error('Kullanıcı kimliği belirtilmelidir.');
    const client = getSupabase();

    const payload: UpdateProfileInput = {
      first_name: input.first_name !== undefined ? input.first_name : null,
      last_name: input.last_name !== undefined ? input.last_name : null,
      phone: input.phone !== undefined ? input.phone : null,
    };

    const { data, error } = await client
      .from('customer_profiles')
      .update(payload)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Profil güncellenirken hata oluştu: ${error.message}`);
    }

    return data as CustomerProfile;
  },
};

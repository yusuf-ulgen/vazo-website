import { getSupabase } from '@/shared/lib/supabase';
import type { CustomerAddress, CreateAddressInput, UpdateAddressInput } from '../types';

export const customerAddressRepository = {
  /**
   * Fetches all saved addresses for the authenticated customer.
   */
  async getMyAddresses(userId: string): Promise<CustomerAddress[]> {
    if (!userId) return [];
    const client = getSupabase();
    const { data, error } = await client
      .from('customer_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default_shipping', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Adresler listelenirken hata oluştu: ${error.message}`);
    }

    return (data as CustomerAddress[]) || [];
  },

  /**
   * Creates a new address for the authenticated customer.
   */
  async createAddress(userId: string, input: CreateAddressInput): Promise<CustomerAddress> {
    if (!userId) throw new Error('Kullanıcı kimliği belirtilmelidir.');
    const client = getSupabase();

    const payload = {
      user_id: userId,
      label: input.label.trim() || 'Ev',
      recipient_name: input.recipient_name.trim(),
      phone: input.phone.trim(),
      address_line1: input.address_line1.trim(),
      address_line2: input.address_line2?.trim() || null,
      district: input.district?.trim() || null,
      city: input.city.trim(),
      state_province: input.state_province?.trim() || null,
      postal_code: input.postal_code.trim(),
      country_code: input.country_code.trim().toUpperCase(),
      country_name: input.country_name.trim(),
      is_default_shipping: Boolean(input.is_default_shipping),
      is_default_billing: Boolean(input.is_default_billing),
    };

    const { data, error } = await client
      .from('customer_addresses')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Adres kaydedilirken hata oluştu: ${error.message}`);
    }

    return data as CustomerAddress;
  },

  /**
   * Updates an existing customer address.
   */
  async updateAddress(
    userId: string,
    addressId: string,
    input: UpdateAddressInput
  ): Promise<CustomerAddress> {
    if (!userId || !addressId) throw new Error('Kullanıcı ve adres kimliği belirtilmelidir.');
    const client = getSupabase();

    const payload: Record<string, unknown> = {};
    if (input.label !== undefined) payload.label = input.label.trim();
    if (input.recipient_name !== undefined) payload.recipient_name = input.recipient_name.trim();
    if (input.phone !== undefined) payload.phone = input.phone.trim();
    if (input.address_line1 !== undefined) payload.address_line1 = input.address_line1.trim();
    if (input.address_line2 !== undefined) payload.address_line2 = input.address_line2?.trim() || null;
    if (input.district !== undefined) payload.district = input.district?.trim() || null;
    if (input.city !== undefined) payload.city = input.city.trim();
    if (input.state_province !== undefined) payload.state_province = input.state_province?.trim() || null;
    if (input.postal_code !== undefined) payload.postal_code = input.postal_code.trim();
    if (input.country_code !== undefined) payload.country_code = input.country_code.trim().toUpperCase();
    if (input.country_name !== undefined) payload.country_name = input.country_name.trim();
    if (input.is_default_shipping !== undefined) payload.is_default_shipping = input.is_default_shipping;
    if (input.is_default_billing !== undefined) payload.is_default_billing = input.is_default_billing;

    const { data, error } = await client
      .from('customer_addresses')
      .update(payload)
      .eq('id', addressId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Adres güncellenirken hata oluştu: ${error.message}`);
    }

    return data as CustomerAddress;
  },

  /**
   * Deletes a customer address.
   */
  async deleteAddress(userId: string, addressId: string): Promise<void> {
    if (!userId || !addressId) throw new Error('Kullanıcı ve adres kimliği belirtilmelidir.');
    const client = getSupabase();

    const { error } = await client
      .from('customer_addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Adres silinirken hata oluştu: ${error.message}`);
    }
  },

  /**
   * Sets the specified address as the default shipping address.
   */
  async setDefaultShipping(userId: string, addressId: string): Promise<void> {
    await this.updateAddress(userId, addressId, { is_default_shipping: true });
  },

  /**
   * Sets the specified address as the default billing address.
   */
  async setDefaultBilling(userId: string, addressId: string): Promise<void> {
    await this.updateAddress(userId, addressId, { is_default_billing: true });
  },
};

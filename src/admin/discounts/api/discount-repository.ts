import { requireAdminSupabase } from '@/admin/shared/api/require-admin-supabase';
import { formatErrorMessage } from '@/shared/utils/error-translator';
import type {
  DiscountCode,
  CreateDiscountCodeInput,
  UpdateDiscountCodeInput,
  DiscountCodeFilterParams,
} from '../types';

export const discountRepository = {
  async getAll(params?: DiscountCodeFilterParams): Promise<DiscountCode[]> {
    const client = requireAdminSupabase();
    let query = client
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (params?.scope && params.scope !== 'all') {
      query = query.eq('scope', params.scope);
    }

    if (params?.is_active !== undefined && params.is_active !== 'all') {
      query = query.eq('is_active', params.is_active);
    }

    if (params?.search && params.search.trim()) {
      const s = params.search.trim().toUpperCase();
      query = query.ilike('code', `%${s}%`);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(formatErrorMessage('İndirim kodları yüklenirken hata oluştu', error));
    }

    return (data || []) as DiscountCode[];
  },

  async getById(id: string): Promise<DiscountCode | null> {
    const client = requireAdminSupabase();
    const { data, error } = await client
      .from('discount_codes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(formatErrorMessage('İndirim kodu bulunamadı', error));
    }

    return data as DiscountCode | null;
  },

  async getByCode(code: string): Promise<DiscountCode | null> {
    const client = requireAdminSupabase();
    const cleanCode = code.trim().toUpperCase();
    const { data, error } = await client
      .from('discount_codes')
      .select('*')
      .ilike('code', cleanCode)
      .maybeSingle();

    if (error) {
      throw new Error(formatErrorMessage('İndirim kodu sorgulanırken hata oluştu', error));
    }

    return data as DiscountCode | null;
  },

  async create(input: CreateDiscountCodeInput): Promise<DiscountCode> {
    const client = requireAdminSupabase();
    const normalizedCode = input.code.trim().toUpperCase();

    if (!normalizedCode) {
      throw new Error('İndirim kodu boş bırakılamaz.');
    }

    if (input.discount_percentage <= 0 || input.discount_percentage > 100) {
      throw new Error('İndirim oranı %1 ile %100 arasında olmalıdır.');
    }

    const payload = {
      code: normalizedCode,
      discount_percentage: Number(input.discount_percentage),
      scope: input.scope,
      scope_id: input.scope_id || null,
      scope_label: input.scope_label || null,
      is_active: input.is_active ?? true,
      usage_limit: input.usage_limit ? Number(input.usage_limit) : null,
      expires_at: input.expires_at || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('discount_codes')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(`"${normalizedCode}" adlı indirim kodu zaten mevcut.`);
      }
      throw new Error(formatErrorMessage('İndirim kodu oluşturulurken bir hata oluştu', error));
    }

    return data as DiscountCode;
  },

  async update(id: string, input: UpdateDiscountCodeInput): Promise<DiscountCode> {
    const client = requireAdminSupabase();
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.code !== undefined) {
      const code = input.code.trim().toUpperCase();
      if (!code) throw new Error('İndirim kodu boş bırakılamaz.');
      payload.code = code;
    }

    if (input.discount_percentage !== undefined) {
      if (input.discount_percentage <= 0 || input.discount_percentage > 100) {
        throw new Error('İndirim oranı %1 ile %100 arasında olmalıdır.');
      }
      payload.discount_percentage = Number(input.discount_percentage);
    }

    if (input.scope !== undefined) payload.scope = input.scope;
    if (input.scope_id !== undefined) payload.scope_id = input.scope_id || null;
    if (input.scope_label !== undefined) payload.scope_label = input.scope_label || null;
    if (input.is_active !== undefined) payload.is_active = input.is_active;
    if (input.usage_limit !== undefined) {
      payload.usage_limit = input.usage_limit ? Number(input.usage_limit) : null;
    }
    if (input.expires_at !== undefined) payload.expires_at = input.expires_at || null;

    const { data, error } = await client
      .from('discount_codes')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Bu isimde bir indirim kodu zaten mevcut.');
      }
      throw new Error(formatErrorMessage('İndirim kodu güncellenirken hata oluştu', error));
    }

    return data as DiscountCode;
  },

  async delete(id: string): Promise<void> {
    const client = requireAdminSupabase();
    const { error } = await client.from('discount_codes').delete().eq('id', id);

    if (error) {
      throw new Error(formatErrorMessage('İndirim kodu silinirken hata oluştu', error));
    }
  },

  async toggleStatus(id: string, isActive: boolean): Promise<DiscountCode> {
    return this.update(id, { is_active: isActive });
  },
};

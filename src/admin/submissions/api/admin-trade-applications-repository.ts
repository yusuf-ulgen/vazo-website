import { requireAdminSupabase } from '@/admin/shared/api/require-admin-supabase';
import type {
  AdminTradeApplication,
  TradeApplicationsFilter,
  UpdateTradeApplicationInput,
  PaginatedResult,
} from '../types';

interface RawTradeApplicationRow {
  id: string;
  company_name: string;
  tax_number: string;
  tax_office: string;
  business_type: string;
  contact_person: string;
  email: string;
  phone: string;
  website: string | null;
  estimated_monthly_volume: string | null;
  customer_message?: string | null;
  notes?: string | null;
  status: string;
  admin_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

function mapRowToTradeApplication(row: RawTradeApplicationRow): AdminTradeApplication {
  const message = row.customer_message || row.notes || null;
  return {
    id: row.id,
    company_name: row.company_name,
    tax_number: row.tax_number,
    tax_office: row.tax_office,
    business_type: row.business_type,
    contact_person: row.contact_person,
    email: row.email,
    phone: row.phone,
    website: row.website,
    estimated_monthly_volume: row.estimated_monthly_volume,
    customer_message: message,
    notes: row.notes || message,
    status: row.status as AdminTradeApplication['status'],
    admin_notes: row.admin_notes,
    submitted_at: row.submitted_at,
    reviewed_at: row.reviewed_at,
  };
}

export const adminTradeApplicationsRepository = {
  async getTradeApplications(
    filters: TradeApplicationsFilter = {}
  ): Promise<PaginatedResult<AdminTradeApplication>> {
    const client = requireAdminSupabase();

    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.max(1, filters.pageSize || 10);
    const status = filters.status || 'all';
    const search = filters.search?.trim().toLowerCase();

    let query = client
      .from('trade_applications')
      .select('*', { count: 'exact' });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(
        `company_name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%,tax_number.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    query = query.order('submitted_at', { ascending: false });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('[adminTradeApplicationsRepository.getTradeApplications] Error:', error.message);
      throw new Error(`Toptan başvuruları yüklenemedi: ${error.message}`);
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return {
      data: ((data as unknown as RawTradeApplicationRow[]) || []).map(mapRowToTradeApplication),
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  },

  async getTradeApplicationById(id: string): Promise<AdminTradeApplication | null> {
    const client = requireAdminSupabase();

    const { data, error } = await client
      .from('trade_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('[adminTradeApplicationsRepository.getTradeApplicationById] Error:', error.message);
      throw new Error(`Başvuru detayları yüklenemedi: ${error.message}`);
    }

    return mapRowToTradeApplication(data as unknown as RawTradeApplicationRow);
  },

  async updateTradeApplication(
    id: string,
    input: UpdateTradeApplicationInput
  ): Promise<AdminTradeApplication> {
    const client = requireAdminSupabase();

    const updatePayload: Record<string, unknown> = {};
    if (input.status !== undefined) updatePayload.status = input.status;
    if (input.admin_notes !== undefined) updatePayload.admin_notes = input.admin_notes;
    updatePayload.reviewed_at = input.reviewed_at || new Date().toISOString();

    const { data, error } = await client
      .from('trade_applications')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[adminTradeApplicationsRepository.updateTradeApplication] Error:', error.message);
      throw new Error(`Başvuru güncellenemedi: ${error.message}`);
    }

    return mapRowToTradeApplication(data as unknown as RawTradeApplicationRow);
  },

  async deleteTradeApplication(id: string): Promise<void> {
    const client = requireAdminSupabase();

    const { error } = await client.from('trade_applications').delete().eq('id', id);

    if (error) {
      console.error('[adminTradeApplicationsRepository.deleteTradeApplication] Error:', error.message);
      throw new Error(`Başvuru silinemedi: ${error.message}`);
    }
  },
};

import { supabase, isSupabaseConfigured } from '@/shared/lib/supabase';
import { mockTradeApplications } from './submissions-mocks';
import type {
  AdminTradeApplication,
  TradeApplicationsFilter,
  UpdateTradeApplicationInput,
  PaginatedResult,
} from '../types';

let localApplications: AdminTradeApplication[] = [...mockTradeApplications];

export const adminTradeApplicationsRepository = {
  async getTradeApplications(
    filters: TradeApplicationsFilter = {}
  ): Promise<PaginatedResult<AdminTradeApplication>> {
    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.max(1, filters.pageSize || 10);
    const status = filters.status || 'all';
    const search = filters.search?.trim().toLowerCase();

    if (!isSupabaseConfigured || !supabase) {
      let filtered = [...localApplications];

      if (status !== 'all') {
        filtered = filtered.filter((a) => a.status === status);
      }

      if (search) {
        filtered = filtered.filter(
          (a) =>
            a.company_name.toLowerCase().includes(search) ||
            a.contact_person.toLowerCase().includes(search) ||
            a.email.toLowerCase().includes(search) ||
            a.tax_number.toLowerCase().includes(search) ||
            a.phone.toLowerCase().includes(search)
        );
      }

      // Order newest first
      filtered.sort(
        (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      );

      const totalCount = filtered.length;
      const totalPages = Math.ceil(totalCount / pageSize) || 1;
      const start = (page - 1) * pageSize;
      const data = filtered.slice(start, start + pageSize);

      return {
        data,
        totalCount,
        page,
        pageSize,
        totalPages,
      };
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase istemcisi yapılandırılmamış. Canlı mod geçerli ortam değişkenleri gerektirir.');
    }

    let query = supabase
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
      data: (data || []) as AdminTradeApplication[],
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  },

  async getTradeApplicationById(id: string): Promise<AdminTradeApplication | null> {
    if (!isSupabaseConfigured || !supabase) {
      const app = localApplications.find((a) => a.id === id);
      return app ? { ...app } : null;
    }

    const { data, error } = await supabase
      .from('trade_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('[adminTradeApplicationsRepository.getTradeApplicationById] Error:', error.message);
      throw new Error(`Başvuru detayları yüklenemedi: ${error.message}`);
    }

    return data as AdminTradeApplication;
  },

  async updateTradeApplication(
    id: string,
    input: UpdateTradeApplicationInput
  ): Promise<AdminTradeApplication> {
    if (!isSupabaseConfigured || !supabase) {
      const idx = localApplications.findIndex((a) => a.id === id);
      if (idx === -1) {
        throw new Error(`Toptan başvuru bulunamadı: ${id}`);
      }

      const existing = localApplications[idx]!;
      const updated: AdminTradeApplication = {
        ...existing,
        status: input.status !== undefined ? input.status : existing.status,
        admin_notes: input.admin_notes !== undefined ? input.admin_notes : existing.admin_notes,
        reviewed_at: input.reviewed_at !== undefined ? input.reviewed_at : new Date().toISOString(),
      };

      localApplications[idx] = updated;
      return { ...updated };
    }

    const updatePayload: Record<string, unknown> = {};
    if (input.status !== undefined) updatePayload.status = input.status;
    if (input.admin_notes !== undefined) updatePayload.admin_notes = input.admin_notes;
    updatePayload.reviewed_at = input.reviewed_at || new Date().toISOString();

    const { data, error } = await supabase
      .from('trade_applications')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[adminTradeApplicationsRepository.updateTradeApplication] Error:', error.message);
      throw new Error(`Başvuru güncellenemedi: ${error.message}`);
    }

    return data as AdminTradeApplication;
  },

  async deleteTradeApplication(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      localApplications = localApplications.filter((a) => a.id !== id);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase istemcisi yapılandırılmamış.');
    }

    const { error } = await supabase.from('trade_applications').delete().eq('id', id);

    if (error) {
      console.error('[adminTradeApplicationsRepository.deleteTradeApplication] Error:', error.message);
      throw new Error(`Başvuru silinemedi: ${error.message}`);
    }
  },
};

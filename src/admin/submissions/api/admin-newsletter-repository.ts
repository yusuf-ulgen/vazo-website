import { supabase, isSupabaseConfigured } from '@/shared/lib/supabase';
import { mockNewsletterSubscriptions } from './submissions-mocks';
import type {
  AdminNewsletterSubscription,
  NewsletterFilter,
  UpdateNewsletterInput,
  PaginatedResult,
} from '../types';

let localSubscriptions: AdminNewsletterSubscription[] = [...mockNewsletterSubscriptions];

export const adminNewsletterRepository = {
  async getNewsletterSubscriptions(
    filters: NewsletterFilter = {}
  ): Promise<PaginatedResult<AdminNewsletterSubscription>> {
    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.max(1, filters.pageSize || 10);
    const status = filters.status || 'all';
    const search = filters.search?.trim().toLowerCase();
    const source = filters.source;

    if (!isSupabaseConfigured || !supabase) {
      let filtered = [...localSubscriptions];

      if (status !== 'all') {
        filtered = filtered.filter((s) => s.status === status);
      }

      if (source && source !== 'all') {
        filtered = filtered.filter((s) => s.source === source);
      }

      if (search) {
        filtered = filtered.filter((s) => s.normalized_email.toLowerCase().includes(search));
      }

      filtered.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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
      .from('newsletter_subscriptions')
      .select('*', { count: 'exact' });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (source && source !== 'all') {
      query = query.eq('source', source);
    }

    if (search) {
      query = query.ilike('normalized_email', `%${search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('[adminNewsletterRepository.getNewsletterSubscriptions] Error:', error.message);
      throw new Error(`Bülten aboneleri yüklenemedi: ${error.message}`);
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return {
      data: (data || []) as AdminNewsletterSubscription[],
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  },

  async updateNewsletterSubscription(
    id: string,
    input: UpdateNewsletterInput
  ): Promise<AdminNewsletterSubscription> {
    if (!isSupabaseConfigured || !supabase) {
      const idx = localSubscriptions.findIndex((s) => s.id === id);
      if (idx === -1) {
        throw new Error(`Bülten abonesi bulunamadı: ${id}`);
      }

      const existing = localSubscriptions[idx]!;
      const updated: AdminNewsletterSubscription = {
        ...existing,
        status: input.status !== undefined ? input.status : existing.status,
        updated_at: new Date().toISOString(),
      };

      localSubscriptions[idx] = updated;
      return { ...updated };
    }

    const { data, error } = await supabase
      .from('newsletter_subscriptions')
      .update({
        status: input.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[adminNewsletterRepository.updateNewsletterSubscription] Error:', error.message);
      throw new Error(`Abone durumu güncellenemedi: ${error.message}`);
    }

    return data as AdminNewsletterSubscription;
  },

  async deleteNewsletterSubscription(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      localSubscriptions = localSubscriptions.filter((s) => s.id !== id);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase istemcisi yapılandırılmamış.');
    }

    const { error } = await supabase.from('newsletter_subscriptions').delete().eq('id', id);

    if (error) {
      console.error('[adminNewsletterRepository.deleteNewsletterSubscription] Error:', error.message);
      throw new Error(`Abone kaydı silinemedi: ${error.message}`);
    }
  },
};

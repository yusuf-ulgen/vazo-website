import { requireAdminSupabase } from '@/admin/shared/api/require-admin-supabase';
import type {
  AdminNewsletterSubscription,
  NewsletterFilter,
  UpdateNewsletterInput,
  PaginatedResult,
} from '../types';

export const adminNewsletterRepository = {
  async getNewsletterSubscriptions(
    filters: NewsletterFilter = {}
  ): Promise<PaginatedResult<AdminNewsletterSubscription>> {
    const client = requireAdminSupabase();

    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.max(1, filters.pageSize || 10);
    const status = filters.status || 'all';
    const source = filters.source || 'all';
    const search = filters.search?.trim().toLowerCase();

    let query = client
      .from('newsletter_subscriptions')
      .select('*', { count: 'exact' });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (source !== 'all') {
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
      throw new Error(`Bülten abonelikleri yüklenemedi: ${error.message}`);
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

  async updateSubscription(
    id: string,
    input: UpdateNewsletterInput
  ): Promise<AdminNewsletterSubscription> {
    const client = requireAdminSupabase();

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.status !== undefined) updatePayload.status = input.status;

    const { data, error } = await client
      .from('newsletter_subscriptions')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[adminNewsletterRepository.updateSubscription] Error:', error.message);
      throw new Error(`Abonelik güncellenemedi: ${error.message}`);
    }

    return data as AdminNewsletterSubscription;
  },

  async deleteSubscription(id: string): Promise<void> {
    const client = requireAdminSupabase();

    const { error } = await client.from('newsletter_subscriptions').delete().eq('id', id);

    if (error) {
      console.error('[adminNewsletterRepository.deleteSubscription] Error:', error.message);
      throw new Error(`Abonelik silinemedi: ${error.message}`);
    }
  },

  async updateNewsletterSubscription(
    id: string,
    input: UpdateNewsletterInput
  ): Promise<AdminNewsletterSubscription> {
    return this.updateSubscription(id, input);
  },

  async deleteNewsletterSubscription(id: string): Promise<void> {
    return this.deleteSubscription(id);
  },
};


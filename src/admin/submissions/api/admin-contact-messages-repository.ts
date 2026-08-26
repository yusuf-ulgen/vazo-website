import { requireAdminSupabase } from '@/admin/shared/api/require-admin-supabase';
import type {
  AdminContactMessage,
  ContactMessagesFilter,
  UpdateContactMessageInput,
  PaginatedResult,
} from '../types';

export const adminContactMessagesRepository = {
  async getContactMessages(
    filters: ContactMessagesFilter = {}
  ): Promise<PaginatedResult<AdminContactMessage>> {
    const client = requireAdminSupabase();

    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.max(1, filters.pageSize || 10);
    const status = filters.status || 'all';
    const search = filters.search?.trim().toLowerCase();

    let query = client
      .from('contact_messages')
      .select('*', { count: 'exact' });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%,message.ilike.%${search}%`
      );
    }

    query = query.order('created_at', { ascending: false });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('[adminContactMessagesRepository.getContactMessages] Error:', error.message);
      throw new Error(`İletişim mesajları yüklenemedi: ${error.message}`);
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return {
      data: (data || []) as AdminContactMessage[],
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  },

  async getContactMessageById(id: string): Promise<AdminContactMessage | null> {
    const client = requireAdminSupabase();

    const { data, error } = await client
      .from('contact_messages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('[adminContactMessagesRepository.getContactMessageById] Error:', error.message);
      throw new Error(`Mesaj detayları yüklenemedi: ${error.message}`);
    }

    return data as AdminContactMessage;
  },

  async updateContactMessage(
    id: string,
    input: UpdateContactMessageInput
  ): Promise<AdminContactMessage> {
    const client = requireAdminSupabase();

    const updatePayload: Record<string, unknown> = {};
    if (input.status !== undefined) updatePayload.status = input.status;
    if (input.admin_notes !== undefined) updatePayload.admin_notes = input.admin_notes;
    updatePayload.reviewed_at = input.reviewed_at || new Date().toISOString();

    const { data, error } = await client
      .from('contact_messages')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[adminContactMessagesRepository.updateContactMessage] Error:', error.message);
      throw new Error(`Mesaj güncellenemedi: ${error.message}`);
    }

    return data as AdminContactMessage;
  },

  async deleteContactMessage(id: string): Promise<void> {
    const client = requireAdminSupabase();

    const { error } = await client.from('contact_messages').delete().eq('id', id);

    if (error) {
      console.error('[adminContactMessagesRepository.deleteContactMessage] Error:', error.message);
      throw new Error(`Mesaj silinemedi: ${error.message}`);
    }
  },
};

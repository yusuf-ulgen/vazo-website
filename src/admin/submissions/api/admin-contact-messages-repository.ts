import { supabase, isSupabaseConfigured } from '@/shared/lib/supabase';
import { mockContactMessages } from './submissions-mocks';
import type {
  AdminContactMessage,
  ContactMessagesFilter,
  UpdateContactMessageInput,
  PaginatedResult,
} from '../types';

let localMessages: AdminContactMessage[] = [...mockContactMessages];

export const adminContactMessagesRepository = {
  async getContactMessages(
    filters: ContactMessagesFilter = {}
  ): Promise<PaginatedResult<AdminContactMessage>> {
    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.max(1, filters.pageSize || 10);
    const status = filters.status || 'all';
    const search = filters.search?.trim().toLowerCase();

    if (!isSupabaseConfigured || !supabase) {
      let filtered = [...localMessages];

      if (status !== 'all') {
        filtered = filtered.filter((m) => m.status === status);
      }

      if (search) {
        filtered = filtered.filter(
          (m) =>
            m.name.toLowerCase().includes(search) ||
            m.email.toLowerCase().includes(search) ||
            m.subject.toLowerCase().includes(search) ||
            m.message.toLowerCase().includes(search)
        );
      }

      // Order newest first
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
    if (!isSupabaseConfigured || !supabase) {
      const msg = localMessages.find((m) => m.id === id);
      return msg ? { ...msg } : null;
    }

    const { data, error } = await supabase
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
    if (!isSupabaseConfigured || !supabase) {
      const idx = localMessages.findIndex((m) => m.id === id);
      if (idx === -1) {
        throw new Error(`İletişim mesajı bulunamadı: ${id}`);
      }

      const existing = localMessages[idx]!;
      const updated: AdminContactMessage = {
        ...existing,
        status: input.status !== undefined ? input.status : existing.status,
        admin_notes: input.admin_notes !== undefined ? input.admin_notes : existing.admin_notes,
        reviewed_at: input.reviewed_at !== undefined ? input.reviewed_at : new Date().toISOString(),
      };

      localMessages[idx] = updated;
      return { ...updated };
    }

    const updatePayload: Record<string, unknown> = {};
    if (input.status !== undefined) updatePayload.status = input.status;
    if (input.admin_notes !== undefined) updatePayload.admin_notes = input.admin_notes;
    updatePayload.reviewed_at = input.reviewed_at || new Date().toISOString();

    const { data, error } = await supabase
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
    if (!isSupabaseConfigured || !supabase) {
      localMessages = localMessages.filter((m) => m.id !== id);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase istemcisi yapılandırılmamış.');
    }

    const { error } = await supabase.from('contact_messages').delete().eq('id', id);

    if (error) {
      console.error('[adminContactMessagesRepository.deleteContactMessage] Error:', error.message);
      throw new Error(`Mesaj silinemedi: ${error.message}`);
    }
  },
};

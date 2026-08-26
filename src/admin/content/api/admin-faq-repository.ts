import { requireAdminSupabase } from '@/admin/shared/api/require-admin-supabase';
import type {
  AdminFaqGroup,
  AdminFaqItem,
  CreateFaqGroupInput,
  UpdateFaqGroupInput,
  CreateFaqItemInput,
  UpdateFaqItemInput,
} from '../types';

export const adminFaqRepository = {
  async getFaqGroups(): Promise<AdminFaqGroup[]> {
    const client = requireAdminSupabase();

    const { data, error } = await client
      .from('faq_groups')
      .select(`
        *,
        faq_items (*)
      `)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[adminFaqRepository.getFaqGroups] Error:', error.message);
      throw new Error(`FAQ grupları yüklenemedi: ${error.message}`);
    }

    return (data || []).map((g) => ({
      id: g.id,
      title: g.title,
      sort_order: g.sort_order,
      active: g.active,
      items: (g.faq_items || [])
        .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
        .map((i: {
          id: string;
          group_id: string;
          question: string;
          answer: string;
          sort_order: number;
          active: boolean;
        }) => ({
          id: i.id,
          group_id: i.group_id,
          question: i.question,
          answer: i.answer,
          sort_order: i.sort_order,
          active: i.active,
        })),
    }));
  },

  async createFaqGroup(input: CreateFaqGroupInput): Promise<AdminFaqGroup> {
    const client = requireAdminSupabase();

    const { data, error } = await client
      .from('faq_groups')
      .insert([
        {
          title: input.title,
          sort_order: input.sort_order ?? 0,
          active: input.active ?? true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[adminFaqRepository.createFaqGroup] Error:', error.message);
      throw new Error(`FAQ grubu oluşturulamadı: ${error.message}`);
    }

    return {
      id: data.id,
      title: data.title,
      sort_order: data.sort_order,
      active: data.active,
      items: [],
    };
  },

  async updateFaqGroup(id: string, input: UpdateFaqGroupInput): Promise<AdminFaqGroup> {
    const client = requireAdminSupabase();

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.title !== undefined) payload.title = input.title;
    if (input.sort_order !== undefined) payload.sort_order = input.sort_order;
    if (input.active !== undefined) payload.active = input.active;

    const { data, error } = await client
      .from('faq_groups')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[adminFaqRepository.updateFaqGroup] Error:', error.message);
      throw new Error(`FAQ grubu güncellenemedi: ${error.message}`);
    }

    return {
      id: data.id,
      title: data.title,
      sort_order: data.sort_order,
      active: data.active,
    };
  },

  async deleteFaqGroup(id: string): Promise<void> {
    const client = requireAdminSupabase();

    const { error } = await client.from('faq_groups').delete().eq('id', id);
    if (error) {
      console.error('[adminFaqRepository.deleteFaqGroup] Error:', error.message);
      throw new Error(`FAQ grubu silinemedi: ${error.message}`);
    }
  },

  async createFaqItem(input: CreateFaqItemInput): Promise<AdminFaqItem> {
    const client = requireAdminSupabase();

    const { data, error } = await client
      .from('faq_items')
      .insert([
        {
          group_id: input.group_id,
          question: input.question,
          answer: input.answer,
          sort_order: input.sort_order ?? 0,
          active: input.active ?? true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[adminFaqRepository.createFaqItem] Error:', error.message);
      throw new Error(`FAQ sorusu oluşturulamadı: ${error.message}`);
    }

    return {
      id: data.id,
      group_id: data.group_id,
      question: data.question,
      answer: data.answer,
      sort_order: data.sort_order,
      active: data.active,
    };
  },

  async updateFaqItem(id: string, input: UpdateFaqItemInput): Promise<AdminFaqItem> {
    const client = requireAdminSupabase();

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.question !== undefined) payload.question = input.question;
    if (input.answer !== undefined) payload.answer = input.answer;
    if (input.sort_order !== undefined) payload.sort_order = input.sort_order;
    if (input.active !== undefined) payload.active = input.active;

    const { data, error } = await client
      .from('faq_items')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[adminFaqRepository.updateFaqItem] Error:', error.message);
      throw new Error(`FAQ sorusu güncellenemedi: ${error.message}`);
    }

    return {
      id: data.id,
      group_id: data.group_id,
      question: data.question,
      answer: data.answer,
      sort_order: data.sort_order,
      active: data.active,
    };
  },

  async deleteFaqItem(id: string): Promise<void> {
    const client = requireAdminSupabase();

    const { error } = await client.from('faq_items').delete().eq('id', id);
    if (error) {
      console.error('[adminFaqRepository.deleteFaqItem] Error:', error.message);
      throw new Error(`FAQ sorusu silinemedi: ${error.message}`);
    }
  },

  async reorderFaqGroups(orders: { id: string; sort_order: number }[]): Promise<void> {
    const client = requireAdminSupabase();

    await Promise.all(
      orders.map(({ id, sort_order }) =>
        client.from('faq_groups').update({ sort_order }).eq('id', id)
      )
    );
  },

  async reorderFaqItems(orders: { id: string; sort_order: number }[]): Promise<void> {
    const client = requireAdminSupabase();

    await Promise.all(
      orders.map(({ id, sort_order }) =>
        client.from('faq_items').update({ sort_order }).eq('id', id)
      )
    );
  },
};

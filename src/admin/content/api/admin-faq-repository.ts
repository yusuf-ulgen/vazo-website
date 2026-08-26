import { supabase, isSupabaseConfigured } from '@/shared/lib/supabase';
import { mockFaqGroups } from '@/entities/content/api/content-mocks';
import type {
  AdminFaqGroup,
  AdminFaqItem,
  CreateFaqGroupInput,
  UpdateFaqGroupInput,
  CreateFaqItemInput,
  UpdateFaqItemInput,
} from '../types';

let mockAdminFaqGroups: AdminFaqGroup[] = mockFaqGroups.map((g) => ({
  id: g.id,
  title: g.title,
  sort_order: g.sortOrder,
  active: g.active,
  items: (g.items || []).map((i) => ({
    id: i.id,
    group_id: i.groupId,
    question: i.question,
    answer: i.answer,
    sort_order: i.sortOrder,
    active: i.active,
  })),
}));

export const adminFaqRepository = {
  async getFaqGroups(): Promise<AdminFaqGroup[]> {
    if (!isSupabaseConfigured || !supabase) {
      return mockAdminFaqGroups
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((g) => ({
          ...g,
          items: [...(g.items || [])].sort((a, b) => a.sort_order - b.sort_order),
        }));
    }

    const { data, error } = await supabase
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
    if (!isSupabaseConfigured || !supabase) {
      const newGroup: AdminFaqGroup = {
        id: `fg-mock-${Date.now()}`,
        title: input.title,
        sort_order: input.sort_order ?? (mockAdminFaqGroups.length + 1),
        active: input.active ?? true,
        items: [],
      };
      mockAdminFaqGroups.push(newGroup);
      return newGroup;
    }

    const { data, error } = await supabase
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
    if (!isSupabaseConfigured || !supabase) {
      const existing = mockAdminFaqGroups.find((g) => g.id === id);
      if (!existing) throw new Error('FAQ group not found');
      const updated: AdminFaqGroup = {
        ...existing,
        title: input.title ?? existing.title,
        sort_order: input.sort_order !== undefined ? input.sort_order : existing.sort_order,
        active: input.active !== undefined ? input.active : existing.active,
      };
      const idx = mockAdminFaqGroups.findIndex((g) => g.id === id);
      mockAdminFaqGroups[idx] = updated;
      return updated;
    }

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.title !== undefined) payload.title = input.title;
    if (input.sort_order !== undefined) payload.sort_order = input.sort_order;
    if (input.active !== undefined) payload.active = input.active;

    const { data, error } = await supabase
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
    if (!isSupabaseConfigured || !supabase) {
      mockAdminFaqGroups = mockAdminFaqGroups.filter((g) => g.id !== id);
      return;
    }

    const { error } = await supabase.from('faq_groups').delete().eq('id', id);
    if (error) {
      console.error('[adminFaqRepository.deleteFaqGroup] Error:', error.message);
      throw new Error(`FAQ grubu silinemedi: ${error.message}`);
    }
  },

  async createFaqItem(input: CreateFaqItemInput): Promise<AdminFaqItem> {
    if (!isSupabaseConfigured || !supabase) {
      const group = mockAdminFaqGroups.find((g) => g.id === input.group_id);
      const newItem: AdminFaqItem = {
        id: `fi-mock-${Date.now()}`,
        group_id: input.group_id,
        question: input.question,
        answer: input.answer,
        sort_order: input.sort_order ?? 1,
        active: input.active ?? true,
      };
      if (group) {
        group.items = group.items || [];
        group.items.push(newItem);
      }
      return newItem;
    }

    const { data, error } = await supabase
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
    if (!isSupabaseConfigured || !supabase) {
      let targetItem: AdminFaqItem | null = null;
      for (const group of mockAdminFaqGroups) {
        if (group.items) {
          const i = group.items.find((item) => item.id === id);
          if (i) {
            targetItem = i;
            break;
          }
        }
      }
      if (!targetItem) throw new Error('FAQ item not found');

      if (input.question !== undefined) targetItem.question = input.question;
      if (input.answer !== undefined) targetItem.answer = input.answer;
      if (input.sort_order !== undefined) targetItem.sort_order = input.sort_order;
      if (input.active !== undefined) targetItem.active = input.active;

      return { ...targetItem };
    }

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.question !== undefined) payload.question = input.question;
    if (input.answer !== undefined) payload.answer = input.answer;
    if (input.sort_order !== undefined) payload.sort_order = input.sort_order;
    if (input.active !== undefined) payload.active = input.active;

    const { data, error } = await supabase
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
    if (!isSupabaseConfigured || !supabase) {
      for (const group of mockAdminFaqGroups) {
        if (group.items) {
          group.items = group.items.filter((i) => i.id !== id);
        }
      }
      return;
    }

    const { error } = await supabase.from('faq_items').delete().eq('id', id);
    if (error) {
      console.error('[adminFaqRepository.deleteFaqItem] Error:', error.message);
      throw new Error(`FAQ sorusu silinemedi: ${error.message}`);
    }
  },

  async reorderFaqGroups(orders: { id: string; sort_order: number }[]): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      for (const { id, sort_order } of orders) {
        const g = mockAdminFaqGroups.find((grp) => grp.id === id);
        if (g) g.sort_order = sort_order;
      }
      return;
    }

    const client = supabase;
    await Promise.all(
      orders.map(({ id, sort_order }) =>
        client.from('faq_groups').update({ sort_order }).eq('id', id)
      )
    );
  },

  async reorderFaqItems(orders: { id: string; sort_order: number }[]): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      for (const { id, sort_order } of orders) {
        for (const group of mockAdminFaqGroups) {
          if (group.items) {
            const i = group.items.find((item) => item.id === id);
            if (i) i.sort_order = sort_order;
          }
        }
      }
      return;
    }

    const client = supabase;
    await Promise.all(
      orders.map(({ id, sort_order }) =>
        client.from('faq_items').update({ sort_order }).eq('id', id)
      )
    );
  },
};

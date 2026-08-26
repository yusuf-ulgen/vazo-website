import { requireAdminSupabase } from '@/admin/shared/api/require-admin-supabase';
import type {
  AdminMenuGroup,
  AdminMenuItem,
  CreateMenuGroupInput,
  UpdateMenuGroupInput,
  CreateMenuItemInput,
  UpdateMenuItemInput,
  MenuType,
} from '../types';

export const adminNavigationRepository = {
  async getMenuGroups(menuType?: MenuType): Promise<AdminMenuGroup[]> {
    const client = requireAdminSupabase();

    let query = client
      .from('menu_groups')
      .select(`
        *,
        menu_items (*)
      `)
      .order('sort_order', { ascending: true });

    if (menuType) {
      query = query.eq('menu_type', menuType);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[adminNavigationRepository.getMenuGroups] Error:', error.message);
      throw new Error(`Menü grupları yüklenemedi: ${error.message}`);
    }

    return (data || []).map((g) => ({
      id: g.id,
      menu_type: g.menu_type,
      title: g.title,
      promo_title: g.promo_title,
      promo_subtitle: g.promo_subtitle,
      promo_image_url: g.promo_image_url,
      promo_cta_text: g.promo_cta_text,
      promo_cta_url: g.promo_cta_url,
      sort_order: g.sort_order,
      active: g.active,
      items: (g.menu_items || [])
        .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
        .map((item: { id: string; group_id: string; label: string; href: string; is_new: boolean; is_popular: boolean; sort_order: number; active: boolean }) => ({
          id: item.id,
          group_id: item.group_id,
          label: item.label,
          href: item.href,
          is_new: item.is_new,
          is_popular: item.is_popular,
          sort_order: item.sort_order,
          active: item.active,
        })),
    }));
  },

  async createMenuGroup(input: CreateMenuGroupInput): Promise<AdminMenuGroup> {
    const client = requireAdminSupabase();

    const { data, error } = await client
      .from('menu_groups')
      .insert([
        {
          menu_type: input.menu_type,
          title: input.title,
          promo_title: input.promo_title || null,
          promo_subtitle: input.promo_subtitle || null,
          promo_image_url: input.promo_image_url || null,
          promo_cta_text: input.promo_cta_text || null,
          promo_cta_url: input.promo_cta_url || null,
          sort_order: input.sort_order ?? 0,
          active: input.active ?? true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[adminNavigationRepository.createMenuGroup] Error:', error.message);
      throw new Error(`Menü grubu oluşturulamadı: ${error.message}`);
    }

    return {
      id: data.id,
      menu_type: data.menu_type,
      title: data.title,
      promo_title: data.promo_title,
      promo_subtitle: data.promo_subtitle,
      promo_image_url: data.promo_image_url,
      promo_cta_text: data.promo_cta_text,
      promo_cta_url: data.promo_cta_url,
      sort_order: data.sort_order,
      active: data.active,
      items: [],
    };
  },

  async updateMenuGroup(id: string, input: UpdateMenuGroupInput): Promise<AdminMenuGroup> {
    const client = requireAdminSupabase();

    const payload: Record<string, unknown> = {};
    if (input.menu_type !== undefined) payload.menu_type = input.menu_type;
    if (input.title !== undefined) payload.title = input.title;
    if (input.promo_title !== undefined) payload.promo_title = input.promo_title;
    if (input.promo_subtitle !== undefined) payload.promo_subtitle = input.promo_subtitle;
    if (input.promo_image_url !== undefined) payload.promo_image_url = input.promo_image_url;
    if (input.promo_cta_text !== undefined) payload.promo_cta_text = input.promo_cta_text;
    if (input.promo_cta_url !== undefined) payload.promo_cta_url = input.promo_cta_url;
    if (input.sort_order !== undefined) payload.sort_order = input.sort_order;
    if (input.active !== undefined) payload.active = input.active;

    const { data, error } = await client
      .from('menu_groups')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[adminNavigationRepository.updateMenuGroup] Error:', error.message);
      throw new Error(`Menü grubu güncellenemedi: ${error.message}`);
    }

    return {
      id: data.id,
      menu_type: data.menu_type,
      title: data.title,
      promo_title: data.promo_title,
      promo_subtitle: data.promo_subtitle,
      promo_image_url: data.promo_image_url,
      promo_cta_text: data.promo_cta_text,
      promo_cta_url: data.promo_cta_url,
      sort_order: data.sort_order,
      active: data.active,
    };
  },

  async deleteMenuGroup(id: string): Promise<void> {
    const client = requireAdminSupabase();

    const { error } = await client.from('menu_groups').delete().eq('id', id);
    if (error) {
      console.error('[adminNavigationRepository.deleteMenuGroup] Error:', error.message);
      throw new Error(`Menü grubu silinemedi: ${error.message}`);
    }
  },

  async createMenuItem(input: CreateMenuItemInput): Promise<AdminMenuItem> {
    const client = requireAdminSupabase();

    const { data, error } = await client
      .from('menu_items')
      .insert([
        {
          group_id: input.group_id,
          label: input.label,
          href: input.href,
          is_new: input.is_new ?? false,
          is_popular: input.is_popular ?? false,
          sort_order: input.sort_order ?? 0,
          active: input.active ?? true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[adminNavigationRepository.createMenuItem] Error:', error.message);
      throw new Error(`Menü öğesi oluşturulamadı: ${error.message}`);
    }

    return {
      id: data.id,
      group_id: data.group_id,
      label: data.label,
      href: data.href,
      is_new: data.is_new,
      is_popular: data.is_popular,
      sort_order: data.sort_order,
      active: data.active,
    };
  },

  async updateMenuItem(id: string, input: UpdateMenuItemInput): Promise<AdminMenuItem> {
    const client = requireAdminSupabase();

    const payload: Record<string, unknown> = {};
    if (input.label !== undefined) payload.label = input.label;
    if (input.href !== undefined) payload.href = input.href;
    if (input.is_new !== undefined) payload.is_new = input.is_new;
    if (input.is_popular !== undefined) payload.is_popular = input.is_popular;
    if (input.sort_order !== undefined) payload.sort_order = input.sort_order;
    if (input.active !== undefined) payload.active = input.active;

    const { data, error } = await client
      .from('menu_items')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[adminNavigationRepository.updateMenuItem] Error:', error.message);
      throw new Error(`Menü öğesi güncellenemedi: ${error.message}`);
    }

    return {
      id: data.id,
      group_id: data.group_id,
      label: data.label,
      href: data.href,
      is_new: data.is_new,
      is_popular: data.is_popular,
      sort_order: data.sort_order,
      active: data.active,
    };
  },

  async deleteMenuItem(id: string): Promise<void> {
    const client = requireAdminSupabase();

    const { error } = await client.from('menu_items').delete().eq('id', id);
    if (error) {
      console.error('[adminNavigationRepository.deleteMenuItem] Error:', error.message);
      throw new Error(`Menü öğesi silinemedi: ${error.message}`);
    }
  },

  async reorderMenuGroups(orders: { id: string; sort_order: number }[]): Promise<void> {
    const client = requireAdminSupabase();

    await Promise.all(
      orders.map(({ id, sort_order }) =>
        client.from('menu_groups').update({ sort_order }).eq('id', id)
      )
    );
  },

  async reorderMenuItems(orders: { id: string; sort_order: number }[]): Promise<void> {
    const client = requireAdminSupabase();

    await Promise.all(
      orders.map(({ id, sort_order }) =>
        client.from('menu_items').update({ sort_order }).eq('id', id)
      )
    );
  },
};

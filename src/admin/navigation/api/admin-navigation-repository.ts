import { supabase, isSupabaseConfigured } from '@/shared/lib/supabase';
import type {
  AdminMenuGroup,
  AdminMenuItem,
  CreateMenuGroupInput,
  UpdateMenuGroupInput,
  CreateMenuItemInput,
  UpdateMenuItemInput,
  MenuType,
} from '../types';

let mockAdminGroups: AdminMenuGroup[] = [
  {
    id: 'mg-01',
    menu_type: 'retail_mega',
    title: 'Kategoriler',
    promo_title: 'Yeni Sezon: Nordik Sessizlik',
    promo_subtitle: 'Heykelsi silüetler ve mineral mat sırlı yüzeylerin dingin uyumu.',
    promo_image_url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80',
    promo_cta_text: 'Koleksiyonu İncele',
    promo_cta_url: '/collections/nordic-silence',
    sort_order: 1,
    active: true,
    items: [
      { id: 'mi-01', group_id: 'mg-01', label: 'Tüm Koleksiyon', href: '/products', is_new: false, is_popular: false, sort_order: 1, active: true },
      { id: 'mi-02', group_id: 'mg-01', label: 'Yeni Gelenler', href: '/products?filter=new', is_new: true, is_popular: false, sort_order: 2, active: true },
      { id: 'mi-03', group_id: 'mg-01', label: 'Çok Satanlar', href: '/products?filter=bestseller', is_new: false, is_popular: true, sort_order: 3, active: true },
    ],
  },
  {
    id: 'mg-02',
    menu_type: 'retail_mega',
    title: 'Materyal & Doku',
    sort_order: 2,
    active: true,
    items: [
      { id: 'mi-04', group_id: 'mg-02', label: 'Mat Stoneware Seramik', href: '/products?material=stoneware', is_new: false, is_popular: false, sort_order: 1, active: true },
    ],
  },
  {
    id: 'mg-03',
    menu_type: 'wholesale_mega',
    title: 'Toptan Çözümleri',
    promo_title: 'Mimari Projeler & Toptan Alım',
    promo_subtitle: '10+ adet alımlarda anında hacim indirimi ve projeye özel danışmanlık.',
    promo_image_url: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=600&q=80',
    promo_cta_text: 'Kurumsal Başvuru Yap',
    promo_cta_url: '/wholesale/apply',
    sort_order: 1,
    active: true,
    items: [
      { id: 'mi-05', group_id: 'mg-03', label: 'Toptan Satış Programı', href: '/wholesale', is_new: false, is_popular: false, sort_order: 1, active: true },
    ],
  },
  {
    id: 'mg-04',
    menu_type: 'primary',
    title: 'Ana Menü',
    sort_order: 1,
    active: true,
    items: [
      { id: 'mi-06', group_id: 'mg-04', label: 'Yeni', href: '/new', is_new: false, is_popular: false, sort_order: 1, active: true },
      { id: 'mi-07', group_id: 'mg-04', label: 'Perakende', href: '/products', is_new: false, is_popular: false, sort_order: 2, active: true },
      { id: 'mi-08', group_id: 'mg-04', label: 'Toptan', href: '/wholesale', is_new: false, is_popular: false, sort_order: 3, active: true },
      { id: 'mi-09', group_id: 'mg-04', label: 'Koleksiyonlar', href: '/collections', is_new: false, is_popular: false, sort_order: 4, active: true },
      { id: 'mi-10', group_id: 'mg-04', label: 'Hakkımızda', href: '/about', is_new: false, is_popular: false, sort_order: 5, active: true },
      { id: 'mi-11', group_id: 'mg-04', label: 'İletişim', href: '/contact', is_new: false, is_popular: false, sort_order: 6, active: true },
    ],
  },
  {
    id: 'mg-05',
    menu_type: 'footer',
    title: 'Alışveriş',
    sort_order: 1,
    active: true,
    items: [
      { id: 'mi-12', group_id: 'mg-05', label: 'Tüm Modeller', href: '/products', is_new: false, is_popular: false, sort_order: 1, active: true },
      { id: 'mi-13', group_id: 'mg-05', label: 'Yeni Gelenler', href: '/new', is_new: false, is_popular: false, sort_order: 2, active: true },
    ],
  },
];

let mockAdminItems: AdminMenuItem[] = mockAdminGroups.flatMap((g) => g.items || []);

export const adminNavigationRepository = {
  async getMenuGroups(menuType?: MenuType): Promise<AdminMenuGroup[]> {
    if (!isSupabaseConfigured || !supabase) {
      let filtered = [...mockAdminGroups];
      if (menuType) {
        filtered = filtered.filter((g) => g.menu_type === menuType);
      }
      return filtered
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((g) => ({
          ...g,
          items: mockAdminItems
            .filter((item) => item.group_id === g.id)
            .sort((a, b) => a.sort_order - b.sort_order),
        }));
    }

    let query = supabase
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
    if (!isSupabaseConfigured || !supabase) {
      const newGroup: AdminMenuGroup = {
        id: `mg-mock-${Date.now()}`,
        menu_type: input.menu_type,
        title: input.title,
        promo_title: input.promo_title || null,
        promo_subtitle: input.promo_subtitle || null,
        promo_image_url: input.promo_image_url || null,
        promo_cta_text: input.promo_cta_text || null,
        promo_cta_url: input.promo_cta_url || null,
        sort_order: input.sort_order ?? (mockAdminGroups.length + 1),
        active: input.active ?? true,
        items: [],
      };
      mockAdminGroups.push(newGroup);
      return newGroup;
    }

    const { data, error } = await supabase
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
    if (!isSupabaseConfigured || !supabase) {
      const existing = mockAdminGroups.find((g) => g.id === id);
      if (!existing) throw new Error('Menu group not found');
      const updated: AdminMenuGroup = {
        id: existing.id,
        menu_type: input.menu_type ?? existing.menu_type,
        title: input.title ?? existing.title,
        promo_title: input.promo_title !== undefined ? input.promo_title : existing.promo_title,
        promo_subtitle: input.promo_subtitle !== undefined ? input.promo_subtitle : existing.promo_subtitle,
        promo_image_url: input.promo_image_url !== undefined ? input.promo_image_url : existing.promo_image_url,
        promo_cta_text: input.promo_cta_text !== undefined ? input.promo_cta_text : existing.promo_cta_text,
        promo_cta_url: input.promo_cta_url !== undefined ? input.promo_cta_url : existing.promo_cta_url,
        sort_order: input.sort_order !== undefined ? input.sort_order : existing.sort_order,
        active: input.active !== undefined ? input.active : existing.active,
        items: existing.items || [],
      };
      const idx = mockAdminGroups.findIndex((g) => g.id === id);
      mockAdminGroups[idx] = updated;
      return updated;
    }

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

    const { data, error } = await supabase
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
    if (!isSupabaseConfigured || !supabase) {
      mockAdminGroups = mockAdminGroups.filter((g) => g.id !== id);
      mockAdminItems = mockAdminItems.filter((i) => i.group_id !== id);
      return;
    }

    const { error } = await supabase.from('menu_groups').delete().eq('id', id);
    if (error) {
      console.error('[adminNavigationRepository.deleteMenuGroup] Error:', error.message);
      throw new Error(`Menü grubu silinemedi: ${error.message}`);
    }
  },

  async createMenuItem(input: CreateMenuItemInput): Promise<AdminMenuItem> {
    if (!isSupabaseConfigured || !supabase) {
      const newItem: AdminMenuItem = {
        id: `mi-mock-${Date.now()}`,
        group_id: input.group_id,
        label: input.label,
        href: input.href,
        is_new: input.is_new ?? false,
        is_popular: input.is_popular ?? false,
        sort_order: input.sort_order ?? (mockAdminItems.length + 1),
        active: input.active ?? true,
      };
      mockAdminItems.push(newItem);
      return newItem;
    }

    const { data, error } = await supabase
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
    if (!isSupabaseConfigured || !supabase) {
      const existing = mockAdminItems.find((i) => i.id === id);
      if (!existing) throw new Error('Menu item not found');
      const updated: AdminMenuItem = {
        id: existing.id,
        group_id: existing.group_id,
        label: input.label ?? existing.label,
        href: input.href ?? existing.href,
        is_new: input.is_new !== undefined ? input.is_new : existing.is_new,
        is_popular: input.is_popular !== undefined ? input.is_popular : existing.is_popular,
        sort_order: input.sort_order !== undefined ? input.sort_order : existing.sort_order,
        active: input.active !== undefined ? input.active : existing.active,
      };
      const idx = mockAdminItems.findIndex((i) => i.id === id);
      mockAdminItems[idx] = updated;
      return updated;
    }

    const payload: Record<string, unknown> = {};
    if (input.label !== undefined) payload.label = input.label;
    if (input.href !== undefined) payload.href = input.href;
    if (input.is_new !== undefined) payload.is_new = input.is_new;
    if (input.is_popular !== undefined) payload.is_popular = input.is_popular;
    if (input.sort_order !== undefined) payload.sort_order = input.sort_order;
    if (input.active !== undefined) payload.active = input.active;

    const { data, error } = await supabase
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
    if (!isSupabaseConfigured || !supabase) {
      mockAdminItems = mockAdminItems.filter((i) => i.id !== id);
      return;
    }

    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) {
      console.error('[adminNavigationRepository.deleteMenuItem] Error:', error.message);
      throw new Error(`Menü öğesi silinemedi: ${error.message}`);
    }
  },

  async reorderMenuGroups(orders: { id: string; sort_order: number }[]): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      orders.forEach(({ id, sort_order }) => {
        const item = mockAdminGroups.find((g) => g.id === id);
        if (item) item.sort_order = sort_order;
      });
      return;
    }

    const client = supabase;
    await Promise.all(
      orders.map(({ id, sort_order }) =>
        client.from('menu_groups').update({ sort_order }).eq('id', id)
      )
    );
  },

  async reorderMenuItems(orders: { id: string; sort_order: number }[]): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      orders.forEach(({ id, sort_order }) => {
        const item = mockAdminItems.find((i) => i.id === id);
        if (item) item.sort_order = sort_order;
      });
      return;
    }

    const client = supabase;
    await Promise.all(
      orders.map(({ id, sort_order }) =>
        client.from('menu_items').update({ sort_order }).eq('id', id)
      )
    );
  },
};

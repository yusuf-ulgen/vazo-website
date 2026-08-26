import { describe, it, expect, beforeEach, vi } from 'vitest';
import { adminNavigationRepository } from '@/admin/navigation/api/admin-navigation-repository';

describe('adminNavigationRepository (Phase 2.9)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Menu Groups Operations', () => {
    it('fetches all menu groups', async () => {
      const groups = await adminNavigationRepository.getMenuGroups();
      expect(Array.isArray(groups)).toBe(true);
      expect(groups.length).toBeGreaterThanOrEqual(4);
    });

    it('filters menu groups by menu_type', async () => {
      const retailGroups = await adminNavigationRepository.getMenuGroups('retail_mega');
      expect(retailGroups.every((g) => g.menu_type === 'retail_mega')).toBe(true);

      const footerGroups = await adminNavigationRepository.getMenuGroups('footer');
      expect(footerGroups.every((g) => g.menu_type === 'footer')).toBe(true);
    });

    it('creates a new menu group with promo fields', async () => {
      const group = await adminNavigationRepository.createMenuGroup({
        menu_type: 'retail_mega',
        title: 'Özel Seri Koleksiyonu',
        promo_title: 'Sınırlı Üretim',
        promo_subtitle: 'El yapımı özel sırlar',
        promo_image_url: 'https://images.unsplash.com/photo-12345',
        promo_cta_text: 'Şimdi İncele',
        promo_cta_url: '/collections/special',
        sort_order: 10,
        active: true,
      });

      expect(group.id).toBeDefined();
      expect(group.title).toBe('Özel Seri Koleksiyonu');
      expect(group.promo_title).toBe('Sınırlı Üretim');
      expect(group.promo_cta_text).toBe('Şimdi İncele');
    });

    it('updates an existing menu group', async () => {
      const groups = await adminNavigationRepository.getMenuGroups();
      const target = groups[0];

      const updated = await adminNavigationRepository.updateMenuGroup(target.id, {
        title: 'Güncellenmiş Grup Başlığı',
        active: false,
      });

      expect(updated.title).toBe('Güncellenmiş Grup Başlığı');
      expect(updated.active).toBe(false);
    });

    it('deletes a menu group', async () => {
      const created = await adminNavigationRepository.createMenuGroup({
        menu_type: 'primary',
        title: 'Silinecek Grup',
        sort_order: 99,
        active: true,
      });

      await adminNavigationRepository.deleteMenuGroup(created.id);
      const groups = await adminNavigationRepository.getMenuGroups();
      expect(groups.some((g) => g.id === created.id)).toBe(false);
    });

    it('reorders menu groups', async () => {
      const groups = await adminNavigationRepository.getMenuGroups();
      if (groups.length >= 2) {
        await adminNavigationRepository.reorderMenuGroups([
          { id: groups[0].id, sort_order: 100 },
          { id: groups[1].id, sort_order: 200 },
        ]);

        const updated = await adminNavigationRepository.getMenuGroups();
        const g0 = updated.find((g) => g.id === groups[0].id);
        const g1 = updated.find((g) => g.id === groups[1].id);
        expect(g0?.sort_order).toBe(100);
        expect(g1?.sort_order).toBe(200);
      }
    });
  });

  describe('Menu Items Operations', () => {
    it('creates a new menu item within a group', async () => {
      const groups = await adminNavigationRepository.getMenuGroups();
      const targetGroup = groups[0];

      const item = await adminNavigationRepository.createMenuItem({
        group_id: targetGroup.id,
        label: 'Zemin Vazoları',
        href: '/products?category=floor-vases',
        is_new: true,
        is_popular: false,
        sort_order: 5,
        active: true,
      });

      expect(item.id).toBeDefined();
      expect(item.label).toBe('Zemin Vazoları');
      expect(item.href).toBe('/products?category=floor-vases');
      expect(item.is_new).toBe(true);
    });

    it('updates a menu item', async () => {
      const groups = await adminNavigationRepository.getMenuGroups();
      const targetGroup = groups.find((g) => g.items && g.items.length > 0);
      expect(targetGroup).toBeDefined();

      const item = targetGroup!.items![0];
      const updated = await adminNavigationRepository.updateMenuItem(item.id, {
        label: 'Güncel Link Başlığı',
        is_popular: true,
        active: false,
      });

      expect(updated.label).toBe('Güncel Link Başlığı');
      expect(updated.is_popular).toBe(true);
      expect(updated.active).toBe(false);
    });

    it('deletes a menu item', async () => {
      const groups = await adminNavigationRepository.getMenuGroups();
      const targetGroup = groups[0];

      const created = await adminNavigationRepository.createMenuItem({
        group_id: targetGroup.id,
        label: 'Geçici Bağlantı',
        href: '/temp',
        sort_order: 99,
        active: true,
      });

      await adminNavigationRepository.deleteMenuItem(created.id);
      const updatedGroups = await adminNavigationRepository.getMenuGroups();
      const currentGroup = updatedGroups.find((g) => g.id === targetGroup.id);
      expect(currentGroup?.items?.some((i) => i.id === created.id)).toBe(false);
    });

    it('reorders menu items', async () => {
      const groups = await adminNavigationRepository.getMenuGroups();
      const targetGroup = groups.find((g) => g.items && g.items.length >= 2);
      if (targetGroup && targetGroup.items) {
        const item0 = targetGroup.items[0];
        const item1 = targetGroup.items[1];

        await adminNavigationRepository.reorderMenuItems([
          { id: item0.id, sort_order: 50 },
          { id: item1.id, sort_order: 60 },
        ]);

        const updatedGroups = await adminNavigationRepository.getMenuGroups();
        const curGroup = updatedGroups.find((g) => g.id === targetGroup.id);
        const i0 = curGroup?.items?.find((i) => i.id === item0.id);
        const i1 = curGroup?.items?.find((i) => i.id === item1.id);
        expect(i0?.sort_order).toBe(50);
        expect(i1?.sort_order).toBe(60);
      }
    });
  });
});

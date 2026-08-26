import { describe, it, expect } from 'vitest';
import { adminFaqRepository } from '@/admin/content/api/admin-faq-repository';

describe('adminFaqRepository', () => {
  it('fetches all FAQ groups with items', async () => {
    const groups = await adminFaqRepository.getFaqGroups();
    expect(Array.isArray(groups)).toBe(true);
    expect(groups.length).toBeGreaterThan(0);

    const first = groups[0];
    expect(first.title).toBeDefined();
    expect(Array.isArray(first.items)).toBe(true);
    expect(first.items?.length).toBeGreaterThan(0);
  });

  it('creates, updates, and deletes a FAQ group', async () => {
    const newGroup = await adminFaqRepository.createFaqGroup({
      title: 'Kargo ve İade',
      sort_order: 10,
      active: true,
    });

    expect(newGroup.title).toBe('Kargo ve İade');
    expect(newGroup.active).toBe(true);

    const updated = await adminFaqRepository.updateFaqGroup(newGroup.id, {
      title: 'Kargo, Ambalaj ve İade',
      active: false,
    });

    expect(updated.title).toBe('Kargo, Ambalaj ve İade');
    expect(updated.active).toBe(false);

    await adminFaqRepository.deleteFaqGroup(newGroup.id);
    const groups = await adminFaqRepository.getFaqGroups();
    expect(groups.find((g) => g.id === newGroup.id)).toBeUndefined();
  });

  it('creates, updates, and deletes a FAQ item', async () => {
    const groups = await adminFaqRepository.getFaqGroups();
    const targetGroup = groups[0];

    const newItem = await adminFaqRepository.createFaqItem({
      group_id: targetGroup.id,
      question: 'Yurt dışına gönderim var mı?',
      answer: 'Evet, sigortalı ambar ve kargo ile yapılmaktadır.',
      sort_order: 15,
      active: true,
    });

    expect(newItem.question).toBe('Yurt dışına gönderim var mı?');
    expect(newItem.group_id).toBe(targetGroup.id);

    const updatedItem = await adminFaqRepository.updateFaqItem(newItem.id, {
      question: 'Tüm ülkelere gönderim var mı?',
      active: false,
    });

    expect(updatedItem.question).toBe('Tüm ülkelere gönderim var mı?');
    expect(updatedItem.active).toBe(false);

    await adminFaqRepository.deleteFaqItem(newItem.id);
    const refreshedGroups = await adminFaqRepository.getFaqGroups();
    const foundGroup = refreshedGroups.find((g) => g.id === targetGroup.id);
    expect(foundGroup?.items?.find((i) => i.id === newItem.id)).toBeUndefined();
  });

  it('reorders groups and items without error', async () => {
    const groups = await adminFaqRepository.getFaqGroups();
    if (groups.length >= 2) {
      await expect(
        adminFaqRepository.reorderFaqGroups([
          { id: groups[0].id, sort_order: 2 },
          { id: groups[1].id, sort_order: 1 },
        ])
      ).resolves.toBeUndefined();
    }
  });
});

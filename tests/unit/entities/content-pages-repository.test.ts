import { describe, it, expect } from 'vitest';
import { contentRepository } from '@/entities/content';

describe('contentRepository (Pages & FAQs)', () => {
  it('loads about page with structured sections', async () => {
    const page = await contentRepository.getContentPage('about');
    expect(page).toBeDefined();
    expect(page?.pageKey).toBe('about');
    expect(page?.title).toContain('Hakkımızda');
    expect(Array.isArray(page?.sections)).toBe(true);
    expect(page?.sections?.length).toBeGreaterThan(0);
  });

  it('loads faq groups with active items', async () => {
    const faqs = await contentRepository.getFaqGroups();
    expect(Array.isArray(faqs)).toBe(true);
    expect(faqs.length).toBeGreaterThan(0);
    expect(faqs[0].title).toBeDefined();
    expect(faqs[0].items?.length).toBeGreaterThan(0);
  });

  it('loads canonical policy content for privacy, terms, and shipping', async () => {
    const privacy = await contentRepository.getPolicyContent('privacy');
    const terms = await contentRepository.getPolicyContent('terms');
    const shipping = await contentRepository.getPolicyContent('shipping');

    expect(privacy).toBeDefined();
    expect(privacy?.pageKey).toBe('privacy_kvkk');

    expect(terms).toBeDefined();
    expect(terms?.pageKey).toBe('terms');

    expect(shipping).toBeDefined();
    expect(shipping?.pageKey).toBe('shipping_returns');
  });

  it('returns null for non-existent page key', async () => {
    const page = await contentRepository.getContentPage('non_existent_page_123');
    expect(page).toBeNull();
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { adminContentRepository } from '@/admin/content/api/admin-content-repository';

describe('adminContentRepository (Phase 2.8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Hero Slides Admin Operations', () => {
    it('fetches hero slides with default mock slides', async () => {
      const slides = await adminContentRepository.getHeroSlides();
      expect(Array.isArray(slides)).toBe(true);
      expect(slides.length).toBeGreaterThanOrEqual(2);

      const retailSlide = slides.find((s) => s.slot === 'retail');
      const wholesaleSlide = slides.find((s) => s.slot === 'wholesale');

      expect(retailSlide).toBeDefined();
      expect(retailSlide?.title).toBe('Perakende');
      expect(wholesaleSlide).toBeDefined();
      expect(wholesaleSlide?.title).toBe('Toptan');
    });

    it('creates a new hero slide', async () => {
      const newSlide = await adminContentRepository.createHeroSlide({
        slot: 'general',
        eyebrow: 'ÖZEL KAMPANYA',
        title: 'Bahar Koleksiyonu',
        description: 'Yeni sezon seramik vazolar.',
        image_url: 'https://example.com/spring.jpg',
        primary_cta_text: 'İncele',
        primary_cta_url: '/collections/bahar',
        sort_order: 3,
        active: true,
      });

      expect(newSlide.id).toBeDefined();
      expect(newSlide.title).toBe('Bahar Koleksiyonu');
      expect(newSlide.slot).toBe('general');

      const fetched = await adminContentRepository.getHeroSlideById(newSlide.id);
      expect(fetched?.title).toBe('Bahar Koleksiyonu');
    });

    it('updates an existing hero slide', async () => {
      const slides = await adminContentRepository.getHeroSlides();
      const target = slides[0];

      const updated = await adminContentRepository.updateHeroSlide(target.id, {
        title: 'Güncel Perakende Başlığı',
        active: false,
      });

      expect(updated.title).toBe('Güncel Perakende Başlığı');
      expect(updated.active).toBe(false);
    });

    it('deletes a hero slide', async () => {
      const created = await adminContentRepository.createHeroSlide({
        slot: 'retail',
        title: 'Geçici Slide',
        description: 'Silinecek',
        image_url: 'https://example.com/temp.jpg',
        primary_cta_text: 'Git',
        primary_cta_url: '/products',
      });

      await adminContentRepository.deleteHeroSlide(created.id);
      const afterDelete = await adminContentRepository.getHeroSlideById(created.id);
      expect(afterDelete).toBeNull();
    });
  });

  describe('Wholesale Benefits Admin Operations', () => {
    it('fetches wholesale benefits list', async () => {
      const benefits = await adminContentRepository.getWholesaleBenefits();
      expect(Array.isArray(benefits)).toBe(true);
      expect(benefits.length).toBeGreaterThanOrEqual(5);

      expect(benefits[0].title).toBe('Özel Toptan Fiyatlar');
      expect(benefits[0].icon_name).toBe('Tag');
    });

    it('creates a new wholesale benefit', async () => {
      const created = await adminContentRepository.createWholesaleBenefit({
        title: 'Numune Gönderimi',
        description: 'Projeleriniz için onay numunesi desteği.',
        icon_name: 'PackageCheck',
        sort_order: 6,
        active: true,
      });

      expect(created.id).toBeDefined();
      expect(created.title).toBe('Numune Gönderimi');
      expect(created.icon_name).toBe('PackageCheck');
    });

    it('updates a wholesale benefit', async () => {
      const benefits = await adminContentRepository.getWholesaleBenefits();
      const target = benefits[0];

      const updated = await adminContentRepository.updateWholesaleBenefit(target.id, {
        title: 'Hacimli Toptan İndirimleri',
        active: true,
      });

      expect(updated.title).toBe('Hacimli Toptan İndirimleri');
    });

    it('deletes a wholesale benefit', async () => {
      const created = await adminContentRepository.createWholesaleBenefit({
        title: 'Geçici Avantaj',
        description: 'Silinecek',
        icon_name: 'Zap',
      });

      await adminContentRepository.deleteWholesaleBenefit(created.id);
      const list = await adminContentRepository.getWholesaleBenefits();
      expect(list.some((b) => b.id === created.id)).toBe(false);
    });
  });
});

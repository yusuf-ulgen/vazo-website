import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contentRepository } from '@/entities/content/api/content-repository';
import * as supabaseModule from '@/shared/lib/supabase';
import { createMockSupabaseClient } from 'tests/mocks/supabase-mock';

describe('Mutation Functions (submitTradeApplication, submitContactMessage, subscribeNewsletter)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Mock Mode', () => {
    it('submits trade application with mock success', async () => {
      const res = await contentRepository.submitTradeApplication({
        companyName: 'Test Mimarlık',
        taxNumber: '1234567890',
        taxOffice: 'Beyoğlu',
        businessType: 'İç Mimarlık',
        contactPerson: 'Ayşe Yılmaz',
        email: 'ayse@example.com',
        phone: '05551234567',
      });
      expect(res.success).toBe(true);
      expect(res.message).toBeDefined();
    });

    it('submits contact message with mock success', async () => {
      const res = await contentRepository.submitContactMessage({
        name: 'Ahmet Demir',
        email: 'ahmet@example.com',
        subject: 'Sipariş Durumu',
        message: 'Merhaba, siparişim ne zaman kargoya verilir?',
      });
      expect(res.success).toBe(true);
      expect(res.message).toBeDefined();
    });

    it('submits newsletter subscription with mock success', async () => {
      const res = await contentRepository.subscribeNewsletter({
        email: 'abone@example.com',
      });
      expect(res.success).toBe(true);
      expect(res.message).toBeDefined();
    });
  });

  describe('Live Mode Mutations (Edge Functions Boundary)', () => {
    it('throws when live mode is requested without Supabase configuration (NO silent mock fallback)', async () => {
      vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(null);

      await expect(
        contentRepository.submitTradeApplication({
          companyName: 'X',
          taxNumber: '1',
          taxOffice: 'Y',
          businessType: 'Z',
          contactPerson: 'A',
          email: 'a@b.com',
          phone: '1',
        })
      ).rejects.toThrow('Supabase client is not configured. Live mode requires valid Supabase environment variables.');

      await expect(
        contentRepository.submitContactMessage({
          name: 'A',
          email: 'a@b.com',
          subject: 'S',
          message: 'M',
        })
      ).rejects.toThrow('Supabase client is not configured. Live mode requires valid Supabase environment variables.');

      await expect(
        contentRepository.subscribeNewsletter({
          email: 'a@b.com',
        })
      ).rejects.toThrow('Supabase client is not configured. Live mode requires valid Supabase environment variables.');
    });

    it('invokes submit-trade-application Edge Function in live mode', async () => {
      const mockClient = createMockSupabaseClient({});
      mockClient.functions.invoke = vi.fn().mockResolvedValue({
        data: { success: true, message: 'Başvuru alındı.' },
        error: null,
      });

      vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      const res = await contentRepository.submitTradeApplication({
        companyName: 'Arkhe Mimarlık',
        taxNumber: '9876543210',
        taxOffice: 'Kadıköy',
        businessType: 'Tasarım',
        contactPerson: 'Can Eren',
        email: 'can@arkhe.com',
        phone: '05321112233',
      });

      expect(res.success).toBe(true);
      expect(mockClient.functions.invoke).toHaveBeenCalledWith('submit-trade-application', {
        body: expect.objectContaining({ companyName: 'Arkhe Mimarlık' }),
      });
    });

    it('throws when submit-trade-application returns error object or error status', async () => {
      const mockClient = createMockSupabaseClient({});
      mockClient.functions.invoke = vi.fn().mockResolvedValue({
        data: { error: 'Geçersiz kurumsal vergi numarası.' },
        error: null,
      });

      vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      await expect(
        contentRepository.submitTradeApplication({
          companyName: 'Hatalı Başvuru',
          taxNumber: '0000000000',
          taxOffice: 'Şişli',
          businessType: 'Diğer',
          contactPerson: 'Hata',
          email: 'hata@example.com',
          phone: '05000000000',
        })
      ).rejects.toThrow('Geçersiz kurumsal vergi numarası.');
    });

    it('throws when submit-contact-message returns network error or data error', async () => {
      const mockClient = createMockSupabaseClient({});
      mockClient.functions.invoke = vi.fn().mockResolvedValueOnce({
        data: null,
        error: { message: 'Sunucuya bağlanılamadı.' },
      });

      vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      await expect(
        contentRepository.submitContactMessage({
          name: 'Ali Veli',
          email: 'ali@example.com',
          subject: 'Bilgi',
          message: 'Mesajım',
        })
      ).rejects.toThrow('Sunucuya bağlanılamadı.');

      mockClient.functions.invoke = vi.fn().mockResolvedValueOnce({
        data: { error: 'Mesaj alanı boş bırakılamaz.' },
        error: null,
      });

      await expect(
        contentRepository.submitContactMessage({
          name: 'Ali Veli',
          email: 'ali@example.com',
          subject: 'Bilgi',
          message: '',
        })
      ).rejects.toThrow('Mesaj alanı boş bırakılamaz.');
    });

    it('invokes subscribe-newsletter Edge Function successfully', async () => {
      const mockClient = createMockSupabaseClient({});
      mockClient.functions.invoke = vi.fn().mockResolvedValue({
        data: { success: true, message: 'Bülten kaydınız tamamlandı.' },
        error: null,
      });

      vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      const res = await contentRepository.subscribeNewsletter({
        email: 'b2b@example.com',
        source: 'footer',
      });

      expect(res.success).toBe(true);
      expect(mockClient.functions.invoke).toHaveBeenCalledWith('subscribe-newsletter', {
        body: { email: 'b2b@example.com', source: 'footer' },
      });
    });

    it('throws when subscribe-newsletter function invocation fails or returns data error', async () => {
      const mockClient = createMockSupabaseClient({});
      mockClient.functions.invoke = vi.fn().mockResolvedValueOnce({
        data: null,
        error: { message: 'Edge Function invocation error' },
      });

      vi.spyOn(supabaseModule, 'isStorefrontMockEnabled', 'get').mockReturnValue(false);
      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      await expect(
        contentRepository.subscribeNewsletter({
          email: 'hata@example.com',
        })
      ).rejects.toThrow('Edge Function invocation error');

      mockClient.functions.invoke = vi.fn().mockResolvedValueOnce({
        data: { error: 'Geçersiz e-posta formatı.' },
        error: null,
      });

      await expect(
        contentRepository.subscribeNewsletter({
          email: 'hata@example.com',
        })
      ).rejects.toThrow('Geçersiz e-posta formatı.');
    });
  });
});

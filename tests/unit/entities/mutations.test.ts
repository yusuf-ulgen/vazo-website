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

  describe('Live Mode Mutations', () => {
    it('inserts into trade_applications table in live mode', async () => {
      const mockClient = createMockSupabaseClient({
        trade_applications: { data: null, error: null },
      });

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
      expect(mockClient.from).toHaveBeenCalledWith('trade_applications');
    });

    it('throws when trade_applications insert returns error', async () => {
      const mockClient = createMockSupabaseClient({
        trade_applications: { data: null, error: { message: 'Veri hatası' } },
      });

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
      ).rejects.toThrow('Başvuru iletilemedi: Veri hatası');
    });

    it('throws when contact_messages insert returns error', async () => {
      const mockClient = createMockSupabaseClient({
        contact_messages: { data: null, error: { message: 'Geçersiz veri' } },
      });

      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      await expect(
        contentRepository.submitContactMessage({
          name: 'Ali Veli',
          email: 'ali@example.com',
          subject: 'Bilgi',
          message: 'Mesajım',
        })
      ).rejects.toThrow('Mesaj iletilemedi: Geçersiz veri');
    });

    it('handles unique constraint error safely for newsletter idempotency', async () => {
      const mockClient = createMockSupabaseClient({
        newsletter_subscriptions: { data: null, error: { message: 'duplicate key', code: '23505' } },
      });

      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      const res = await contentRepository.subscribeNewsletter({
        email: 'duplicate@example.com',
      });

      expect(res.success).toBe(true);
    });

    it('throws when newsletter insert returns non-duplicate error', async () => {
      const mockClient = createMockSupabaseClient({
        newsletter_subscriptions: { data: null, error: { message: 'Sunucu hatası', code: '500' } },
      });

      vi.spyOn(supabaseModule, 'isSupabaseConfigured', 'get').mockReturnValue(true);
      vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockClient as never);

      await expect(
        contentRepository.subscribeNewsletter({
          email: 'hata@example.com',
        })
      ).rejects.toThrow('Bülten kaydı oluşturulamadı: Sunucu hatası');
    });
  });
});

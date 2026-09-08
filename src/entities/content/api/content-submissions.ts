import { supabase, isSupabaseConfigured, isStorefrontMockEnabled } from '@/shared/lib/supabase';
import { formatErrorMessage } from '@/shared/utils/error-translator';

export interface TradeApplicationPayload {
  companyName: string;
  taxNumber: string;
  taxOffice: string;
  businessType: string;
  contactPerson: string;
  email: string;
  phone: string;
  website?: string;
  estimatedMonthlyVolume?: string;
  customerMessage?: string;
  notes?: string;
  company_website_confirm?: string;
}

export interface ContactMessagePayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  company_website_confirm?: string;
}

export interface NewsletterSubscriptionPayload {
  email: string;
  source?: string;
  company_website_confirm?: string;
}

export const contentSubmissions = {
  async submitTradeApplication(payload: TradeApplicationPayload): Promise<{ success: boolean; message: string }> {
    if (isStorefrontMockEnabled) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        success: true,
        message: 'Toptan başvurunuz başarıyla alındı. Müşteri temsilcimiz en kısa sürede sizinle iletişime geçecektir.',
      };
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Aktif veritabanı bağlantısı bulunamadı. Canlı mod geçerli Supabase ortam değişkenlerini gerektirir.');
    }

    try {
      const { data, error } = await supabase.functions.invoke('submit-trade-application', {
        body: payload,
      });

      if (error) {
        throw new Error(error.message || 'Başvuru sunucuya iletilemedi.');
      }

      if (data && data.error) {
        throw new Error(data.error);
      }

      return {
        success: true,
        message: data?.message || 'Toptan / Trade başvurunuz başarıyla alındı.',
      };
    } catch (err: unknown) {
      const msg = formatErrorMessage('Başvuru iletilirken hata oluştu', err);
      console.error('[contentSubmissions.submitTradeApplication] Error:', msg);
      throw new Error(msg);
    }
  },

  async submitContactMessage(payload: ContactMessagePayload): Promise<{ success: boolean; message: string }> {
    if (isStorefrontMockEnabled) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        success: true,
        message: 'Mesajınız stüdyo ekibimize iletilmiştir.',
      };
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Aktif veritabanı bağlantısı bulunamadı. Canlı mod geçerli Supabase ortam değişkenlerini gerektirir.');
    }

    try {
      const { data, error } = await supabase.functions.invoke('submit-contact-message', {
        body: payload,
      });

      if (error) {
        throw new Error(error.message || 'Mesaj sunucuya iletilemedi.');
      }

      if (data && data.error) {
        throw new Error(data.error);
      }

      return {
        success: true,
        message: data?.message || 'Mesajınız stüdyo ekibimize iletilmiştir.',
      };
    } catch (err: unknown) {
      const msg = formatErrorMessage('Mesaj iletilirken bir hata oluştu', err);
      console.error('[contentSubmissions.submitContactMessage] Error:', msg);
      throw new Error(msg);
    }
  },

  async subscribeNewsletter(payload: NewsletterSubscriptionPayload): Promise<{ success: boolean; message: string }> {
    if (isStorefrontMockEnabled) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        success: true,
        message: 'Bülten kaydınız tamamlandı.',
      };
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Aktif veritabanı bağlantısı bulunamadı. Canlı mod geçerli Supabase ortam değişkenlerini gerektirir.');
    }

    try {
      const { data, error } = await supabase.functions.invoke('subscribe-newsletter', {
        body: payload,
      });

      if (error) {
        throw new Error(error.message || 'Bülten kaydı oluşturulamadı.');
      }

      if (data && data.error) {
        throw new Error(data.error);
      }

      return {
        success: true,
        message: data?.message || 'Bülten kaydınız tamamlandı.',
      };
    } catch (err: unknown) {
      const msg = formatErrorMessage('Bülten kaydı oluşturulamadı', err);
      console.error('[contentSubmissions.subscribeNewsletter] Error:', msg);
      throw new Error(msg);
    }
  },
};

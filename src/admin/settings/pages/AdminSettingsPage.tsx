import React, { useState, useEffect, useCallback } from 'react';
import {
  Save,
  RefreshCw,
  Building,
  Mail,
  Truck,
  Share2,
  Loader2,
} from 'lucide-react';
import {
  AdminPageHeader,
  FormField,
  AdminInput,
  AdminTextarea,
  useToast,
} from '@/admin/ui';
import { adminSettingsRepository } from '../api/admin-settings-repository';
import type {
  GeneralSettings,
  ContactSettings,
  CommerceSettings,
  SocialSettings,
} from '@/entities/settings/types';

export function AdminSettingsPage() {
  const { success, error: toastError } = useToast();

  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [general, setGeneral] = useState<GeneralSettings>({
    brandName: '',
    tagline: '',
    description: '',
  });

  const [contact, setContact] = useState<ContactSettings>({
    email: '',
    wholesaleEmail: '',
    phone: '',
    address: '',
    businessHours: '',
  });

  const [commerce, setCommerce] = useState<CommerceSettings>({
    freeShippingThreshold: 5000,
    shippingEstimateText: '',
    shippingSummary: '',
    returnsPolicyText: '',
  });

  const [social, setSocial] = useState<SocialSettings>({
    instagram: '',
    facebook: '',
    pinterest: '',
  });

  // Saving states
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [isSavingCommerce, setIsSavingCommerce] = useState(false);
  const [isSavingSocial, setIsSavingSocial] = useState(false);

  // Errors
  const [generalErrors, setGeneralErrors] = useState<Record<string, string>>({});
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [commerceErrors, setCommerceErrors] = useState<Record<string, string>>({});
  const [socialErrors, setSocialErrors] = useState<Record<string, string>>({});

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminSettingsRepository.getSettings();
      setGeneral(data.general);
      setContact(data.contact);
      setCommerce(data.commerce);
      setSocial(data.social);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ayarlar yüklenemedi.';
      toastError('Hata', msg);
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // General Submit
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!general.brandName.trim()) errs.brandName = 'Marka adı zorunludur.';
    if (!general.tagline.trim()) errs.tagline = 'Slogan zorunludur.';
    setGeneralErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSavingGeneral(true);
    try {
      await adminSettingsRepository.updateGeneralSettings(general);
      success('Başarılı', 'Genel marka ayarları kaydedildi.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kaydedilemedi.';
      toastError('Hata', msg);
    } finally {
      setIsSavingGeneral(false);
    }
  };

  // Contact Submit
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contact.email.trim() || !emailRegex.test(contact.email)) {
      errs.email = 'Geçerli bir e-posta adresi giriniz.';
    }
    if (!contact.wholesaleEmail.trim() || !emailRegex.test(contact.wholesaleEmail)) {
      errs.wholesaleEmail = 'Geçerli bir toptan e-posta adresi giriniz.';
    }
    if (!contact.phone.trim()) errs.phone = 'Telefon numarası zorunludur.';
    if (!contact.address.trim()) errs.address = 'Showroom adresi zorunludur.';
    setContactErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSavingContact(true);
    try {
      await adminSettingsRepository.updateContactSettings(contact);
      success('Başarılı', 'İletişim ve showroom ayarları kaydedildi.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kaydedilemedi.';
      toastError('Hata', msg);
    } finally {
      setIsSavingContact(false);
    }
  };

  // Commerce Submit
  const handleSaveCommerce = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (commerce.freeShippingThreshold < 0) {
      errs.freeShippingThreshold = 'Ücretsiz kargo limiti 0 veya daha büyük olmalıdır.';
    }
    if (!commerce.shippingEstimateText.trim()) {
      errs.shippingEstimateText = 'Kargo bilgilendirme metni zorunludur.';
    }
    setCommerceErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSavingCommerce(true);
    try {
      await adminSettingsRepository.updateCommerceSettings(commerce);
      success('Başarılı', 'E-Ticaret ve kargo parametreleri kaydedildi.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kaydedilemedi.';
      toastError('Hata', msg);
    } finally {
      setIsSavingCommerce(false);
    }
  };

  // Social Submit
  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const urlRegex = /^https?:\/\/.+/i;
    if (social.instagram && !urlRegex.test(social.instagram)) {
      errs.instagram = 'Geçerli bir URL giriniz (örn: https://instagram.com/...).';
    }
    if (social.facebook && !urlRegex.test(social.facebook)) {
      errs.facebook = 'Geçerli bir URL giriniz (örn: https://facebook.com/...).';
    }
    if (social.pinterest && !urlRegex.test(social.pinterest)) {
      errs.pinterest = 'Geçerli bir URL giriniz (örn: https://pinterest.com/...).';
    }
    setSocialErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSavingSocial(true);
    try {
      await adminSettingsRepository.updateSocialSettings(social);
      success('Başarılı', 'Sosyal medya bağlantıları kaydedildi.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kaydedilemedi.';
      toastError('Hata', msg);
    } finally {
      setIsSavingSocial(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Sistem & Site Ayarları"
        description="Marka kimliği, showroom iletişim bilgileri, e-ticaret parametreleri ve sosyal medya bağlantıları."
        actions={
          <button
            type="button"
            onClick={loadSettings}
            className="p-2 rounded border border-border-default bg-surface-primary text-text-secondary hover:text-text-primary transition-colors"
            title="Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        }
      />

      {isLoading ? (
        <div className="p-12 text-center text-xs text-text-muted bg-surface-primary border border-border-default rounded-lg">
          Ayarlar yükleniyor...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
          {/* 1. General Brand Settings Card */}
          <div className="bg-surface-primary border border-border-default rounded-lg p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
              <Building className="w-4 h-4 text-accent-primary" />
              <h3 className="text-sm font-semibold text-text-primary">Genel Marka Kimliği</h3>
            </div>

            <form onSubmit={handleSaveGeneral} noValidate className="space-y-4">
              <FormField label="Marka Adı" htmlFor="brand-name" required error={generalErrors.brandName}>
                <AdminInput
                  id="brand-name"
                  value={general.brandName}
                  onChange={(e) => setGeneral({ ...general, brandName: e.target.value })}
                  placeholder="Örn: Vazo Studio"
                  error={generalErrors.brandName}
                />
              </FormField>

              <FormField label="Slogan / Tagline" htmlFor="brand-tagline" required error={generalErrors.tagline}>
                <AdminInput
                  id="brand-tagline"
                  value={general.tagline}
                  onChange={(e) => setGeneral({ ...general, tagline: e.target.value })}
                  placeholder="Örn: Heykelsi Formlar & Çağdaş Seramik Tasarımlar"
                  error={generalErrors.tagline}
                />
              </FormField>

              <FormField label="Site Açıklaması (Meta Description)" htmlFor="brand-desc">
                <AdminTextarea
                  id="brand-desc"
                  value={general.description}
                  onChange={(e) => setGeneral({ ...general, description: e.target.value })}
                  rows={3}
                  placeholder="Arama motorları ve sayfa açıklaması için kısa metin."
                />
              </FormField>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingGeneral}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded bg-accent-primary text-text-inverse hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {isSavingGeneral ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Genel Ayarları Kaydet</span>
                </button>
              </div>
            </form>
          </div>

          {/* 2. Contact & Showroom Settings Card */}
          <div className="bg-surface-primary border border-border-default rounded-lg p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
              <Mail className="w-4 h-4 text-accent-primary" />
              <h3 className="text-sm font-semibold text-text-primary">İletişim & Showroom Bilgileri</h3>
            </div>

            <form onSubmit={handleSaveContact} noValidate className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Genel Destek E-Posta" htmlFor="contact-email" required error={contactErrors.email}>
                  <AdminInput
                    id="contact-email"
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    placeholder="info@vazostudio.com"
                    error={contactErrors.email}
                  />
                </FormField>

                <FormField label="Toptan / Trade E-Posta" htmlFor="wholesale-email" required error={contactErrors.wholesaleEmail}>
                  <AdminInput
                    id="wholesale-email"
                    type="email"
                    value={contact.wholesaleEmail}
                    onChange={(e) => setContact({ ...contact, wholesaleEmail: e.target.value })}
                    placeholder="toptan@vazostudio.com"
                    error={contactErrors.wholesaleEmail}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Telefon / WhatsApp" htmlFor="contact-phone" required error={contactErrors.phone}>
                  <AdminInput
                    id="contact-phone"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    placeholder="+90 (212) 555 0192"
                    error={contactErrors.phone}
                  />
                </FormField>

                <FormField label="Çalışma Saatleri" htmlFor="contact-hours">
                  <AdminInput
                    id="contact-hours"
                    value={contact.businessHours}
                    onChange={(e) => setContact({ ...contact, businessHours: e.target.value })}
                    placeholder="Pazartesi – Cumartesi: 10:00 – 19:00"
                  />
                </FormField>
              </div>

              <FormField label="Showroom & Atölye Adresi" htmlFor="contact-address" required error={contactErrors.address}>
                <AdminTextarea
                  id="contact-address"
                  value={contact.address}
                  onChange={(e) => setContact({ ...contact, address: e.target.value })}
                  rows={2}
                  placeholder="Karaköy Tasarım Bölgesi..."
                  error={contactErrors.address}
                />
              </FormField>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingContact}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded bg-accent-primary text-text-inverse hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {isSavingContact ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>İletişim Bilgilerini Kaydet</span>
                </button>
              </div>
            </form>
          </div>

          {/* 3. Commerce & Shipping Parameters Card */}
          <div className="bg-surface-primary border border-border-default rounded-lg p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
              <Truck className="w-4 h-4 text-accent-primary" />
              <h3 className="text-sm font-semibold text-text-primary">E-Ticaret & Kargo Parametreleri</h3>
            </div>

            <form onSubmit={handleSaveCommerce} noValidate className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Ücretsiz Kargo Limiti (TL)"
                  htmlFor="free-shipping-limit"
                  required
                  error={commerceErrors.freeShippingThreshold}
                >
                  <AdminInput
                    id="free-shipping-limit"
                    type="number"
                    value={commerce.freeShippingThreshold}
                    onChange={(e) =>
                      setCommerce({ ...commerce, freeShippingThreshold: Number(e.target.value) || 0 })
                    }
                    error={commerceErrors.freeShippingThreshold}
                  />
                </FormField>

                <FormField
                  label="Kargo Hesaplama Notu"
                  htmlFor="shipping-estimate"
                  required
                  error={commerceErrors.shippingEstimateText}
                >
                  <AdminInput
                    id="shipping-estimate"
                    value={commerce.shippingEstimateText}
                    onChange={(e) => setCommerce({ ...commerce, shippingEstimateText: e.target.value })}
                    placeholder="Örn: Ödeme adımında hesaplanır"
                    error={commerceErrors.shippingEstimateText}
                  />
                </FormField>
              </div>

              <FormField label="Kargo & Güvenlik Özeti" htmlFor="shipping-summary">
                <AdminInput
                  id="shipping-summary"
                  value={commerce.shippingSummary}
                  onChange={(e) => setCommerce({ ...commerce, shippingSummary: e.target.value })}
                  placeholder="Örn: Güvenli Alışveriş ve Sigortalı Sevkiyat"
                />
              </FormField>

              <FormField label="İade Koşulu Özeti" htmlFor="returns-policy">
                <AdminInput
                  id="returns-policy"
                  value={commerce.returnsPolicyText}
                  onChange={(e) => setCommerce({ ...commerce, returnsPolicyText: e.target.value })}
                  placeholder="Örn: Teslimattan itibaren 14 gün içinde iade imkanı."
                />
              </FormField>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingCommerce}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded bg-accent-primary text-text-inverse hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {isSavingCommerce ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Kargo Ayarlarını Kaydet</span>
                </button>
              </div>
            </form>
          </div>

          {/* 4. Social Media Card */}
          <div className="bg-surface-primary border border-border-default rounded-lg p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
              <Share2 className="w-4 h-4 text-accent-primary" />
              <h3 className="text-sm font-semibold text-text-primary">Sosyal Medya Bağlantıları</h3>
            </div>

            <form onSubmit={handleSaveSocial} noValidate className="space-y-4">
              <FormField label="Instagram URL" htmlFor="social-instagram" error={socialErrors.instagram}>
                <AdminInput
                  id="social-instagram"
                  value={social.instagram}
                  onChange={(e) => setSocial({ ...social, instagram: e.target.value })}
                  placeholder="https://instagram.com/vazostudio"
                  error={socialErrors.instagram}
                />
              </FormField>

              <FormField label="Facebook URL" htmlFor="social-facebook" error={socialErrors.facebook}>
                <AdminInput
                  id="social-facebook"
                  value={social.facebook}
                  onChange={(e) => setSocial({ ...social, facebook: e.target.value })}
                  placeholder="https://facebook.com/vazostudio"
                  error={socialErrors.facebook}
                />
              </FormField>

              <FormField label="Pinterest URL" htmlFor="social-pinterest" error={socialErrors.pinterest}>
                <AdminInput
                  id="social-pinterest"
                  value={social.pinterest}
                  onChange={(e) => setSocial({ ...social, pinterest: e.target.value })}
                  placeholder="https://pinterest.com/vazostudio"
                  error={socialErrors.pinterest}
                />
              </FormField>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingSocial}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded bg-accent-primary text-text-inverse hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {isSavingSocial ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Sosyal Medyayı Kaydet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

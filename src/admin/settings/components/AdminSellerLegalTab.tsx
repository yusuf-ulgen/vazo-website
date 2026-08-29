import React, { useState, useMemo } from 'react';
import {
  Scale,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Building2,
  Info,
} from 'lucide-react';
import { FormField, AdminInput, AdminTextarea, useToast } from '@/admin/ui';
import { adminSettingsRepository } from '../api/admin-settings-repository';
import {
  SellerLegalSettings,
  DEFAULT_SELLER_LEGAL,
  SELLER_LEGAL_REQUIRED_FIELDS,
} from '@/entities/settings/types';

interface AdminSellerLegalTabProps {
  initialData?: SellerLegalSettings;
  onSaved?: (data: SellerLegalSettings) => void;
}

export function AdminSellerLegalTab({
  initialData = DEFAULT_SELLER_LEGAL,
  onSaved,
}: AdminSellerLegalTabProps) {
  const { success, error: toastError } = useToast();
  const [legal, setLegal] = useState<SellerLegalSettings>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate completeness of required fields (9 required fields, MERSIS is optional)
  const completeness = useMemo(() => {
    let filledCount = 0;
    const missing: string[] = [];

    SELLER_LEGAL_REQUIRED_FIELDS.forEach((field) => {
      const val = legal[field];
      if (typeof val === 'string' && val.trim() !== '') {
        filledCount += 1;
      } else {
        missing.push(field);
      }
    });

    const total = SELLER_LEGAL_REQUIRED_FIELDS.length;
    const percentage = Math.round((filledCount / total) * 100);
    const isComplete = filledCount === total;

    return { filledCount, total, percentage, isComplete, missing };
  }, [legal]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!legal.business_type.trim()) {
      errs.business_type = 'İşletme türü seçilmelidir.';
    }
    if (!legal.owner_full_name.trim()) {
      errs.owner_full_name = 'İşletme sahibi / yetkili ad soyad zorunludur.';
    }
    if (!legal.legal_trade_title.trim()) {
      errs.legal_trade_title = 'Yasal ticaret unvanı zorunludur.';
    }
    if (!legal.tax_office.trim()) {
      errs.tax_office = 'Bağlı olunan vergi dairesi zorunludur.';
    }
    if (!legal.tax_number.trim()) {
      errs.tax_number = 'Vergi kimlik numarası veya T.C. Kimlik No zorunludur.';
    } else if (!/^\d{10,11}$/.test(legal.tax_number.trim())) {
      errs.tax_number = 'Vergi No 10 haneli, TCKN 11 haneli rakamdan oluşmalıdır.';
    }

    if (!legal.registered_address.trim()) {
      errs.registered_address = 'Yasal tebligat / kayıtlı iş yeri adresi zorunludur.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!legal.business_email.trim()) {
      errs.business_email = 'Resmi ticari e-posta adresi zorunludur.';
    } else if (!emailRegex.test(legal.business_email.trim())) {
      errs.business_email = 'Geçerli bir e-posta formatı giriniz.';
    }

    if (!legal.business_phone.trim()) {
      errs.business_phone = 'Ticari telefon numarası zorunludur.';
    }

    if (!legal.kep_address.trim()) {
      errs.kep_address = 'Kayıtlı Elektronik Posta (KEP) adresi zorunludur.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toastError('Doğrulama Hatası', 'Lütfen zorunlu yasal alanları eksiksiz doldurun.');
      return;
    }

    setIsSaving(true);
    try {
      await adminSettingsRepository.updateSellerLegal(legal);
      success('Başarılı', 'Satıcı yasal kimlik bilgileri başarıyla kaydedildi.');
      onSaved?.(legal);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Yasal bilgiler kaydedilemedi.';
      toastError('Hata', msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Completeness Indicator Card */}
      <div
        className={`p-5 rounded-lg border transition-all ${
          completeness.isComplete
            ? 'bg-feedback-success/5 border-feedback-success/30'
            : 'bg-feedback-warning/5 border-feedback-warning/30'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {completeness.isComplete ? (
              <div className="w-9 h-9 rounded-full bg-feedback-success/15 flex items-center justify-center text-feedback-success shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-feedback-warning/15 flex items-center justify-center text-feedback-warning shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
            )}
            <div>
              <h4 className="text-sm font-semibold text-text-primary">
                {completeness.isComplete
                  ? 'Yasal Satıcı Profili Eksiksiz (%100)'
                  : `Yasal Bilgiler Tamamlanma Durumu: %${completeness.percentage}`}
              </h4>
              <p className="text-xs text-text-secondary mt-0.5">
                {completeness.isComplete
                  ? 'Ödeme sistemini aktif etmek için gereken tüm zorunlu yasal veriler tanımlıdır.'
                  : `${completeness.total} zorunlu alandan ${completeness.filledCount} tanesi dolduruldu. Ödemenin açılabilmesi için tüm zorunlu alanlar doldurulmalıdır.`}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded ${
                completeness.isComplete
                  ? 'bg-feedback-success text-text-inverse'
                  : 'bg-feedback-warning/20 text-feedback-warning'
              }`}
            >
              {completeness.filledCount} / {completeness.total} Zorunlu Alan
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-border-subtle rounded-full h-1.5 mt-4 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              completeness.isComplete ? 'bg-feedback-success' : 'bg-feedback-warning'
            }`}
            style={{ width: `${completeness.percentage}%` }}
          />
        </div>
      </div>

      {/* Main Seller Legal Profile Form */}
      <div className="bg-surface-primary border border-border-default rounded-lg p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2.5">
            <Scale className="w-5 h-5 text-accent-primary" />
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                Satıcı & Yasal İşletme Bilgileri
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                6502 sayılı Kanun ve ETBİS gereğince tüketici sözleşmelerinde ve halka açık satıcı sayfasında gösterilecek resmi bilgiler.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Section 1: Business Entity & Identity */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              1. Şirket & Tacir Kimliği
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="İşletme Türü"
                htmlFor="seller-business-type"
                required
                error={errors.business_type}
              >
                <select
                  id="seller-business-type"
                  value={legal.business_type}
                  onChange={(e) => setLegal({ ...legal, business_type: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-surface-primary border border-border-default rounded focus:border-text-primary focus:outline-none text-text-primary"
                >
                  <option value="">Seçiniz</option>
                  <option value="Şahıs Şirketi / Gerçek Kişi Tacir">
                    Şahıs Şirketi / Gerçek Kişi Tacir
                  </option>
                  <option value="Limited Şirket (Ltd. Şti.)">Limited Şirket (Ltd. Şti.)</option>
                  <option value="Anonim Şirket (A.Ş.)">Anonim Şirket (A.Ş.)</option>
                  <option value="Kollektif / Komandit Şirket">Kollektif / Komandit Şirket</option>
                </select>
              </FormField>

              <FormField
                label="Yetkili / İşletme Sahibi Adı Soyadı"
                htmlFor="seller-owner-name"
                required
                error={errors.owner_full_name}
              >
                <AdminInput
                  id="seller-owner-name"
                  value={legal.owner_full_name}
                  onChange={(e) => setLegal({ ...legal, owner_full_name: e.target.value })}
                  placeholder="Örn: Yusuf Ülgen"
                  error={errors.owner_full_name}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Yasal Ticaret Unvanı"
                htmlFor="seller-legal-title"
                required
                error={errors.legal_trade_title}
              >
                <AdminInput
                  id="seller-legal-title"
                  value={legal.legal_trade_title}
                  onChange={(e) => setLegal({ ...legal, legal_trade_title: e.target.value })}
                  placeholder="Örn: Yusuf Ülgen Monocactus Tasarım"
                  error={errors.legal_trade_title}
                />
              </FormField>

              <FormField label="Marka / İşletme Adı (Varsa)" htmlFor="seller-brand-name">
                <AdminInput
                  id="seller-brand-name"
                  value={legal.brand_name || ''}
                  onChange={(e) =>
                    setLegal({ ...legal, brand_name: e.target.value.trim() ? e.target.value : null })
                  }
                  placeholder="Örn: Monocactus"
                />
              </FormField>
            </div>
          </div>

          {/* Section 2: Tax & Official Address */}
          <div className="space-y-4 pt-4 border-t border-border-subtle">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              2. Vergi & Tebligat Bilgileri
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Bağlı Olunan Vergi Dairesi"
                htmlFor="seller-tax-office"
                required
                error={errors.tax_office}
              >
                <AdminInput
                  id="seller-tax-office"
                  value={legal.tax_office}
                  onChange={(e) => setLegal({ ...legal, tax_office: e.target.value })}
                  placeholder="Örn: Beyoğlu Vergi Dairesi"
                  error={errors.tax_office}
                />
              </FormField>

              <FormField
                label="Vergi Kimlik No / TCKN"
                htmlFor="seller-tax-number"
                required
                error={errors.tax_number}
              >
                <AdminInput
                  id="seller-tax-number"
                  value={legal.tax_number}
                  onChange={(e) => setLegal({ ...legal, tax_number: e.target.value })}
                  placeholder="10 veya 11 haneli numara"
                  error={errors.tax_number}
                />
              </FormField>
            </div>

            <FormField
              label="Kayıtlı Tebligat / İş Yeri Adresi"
              htmlFor="seller-registered-address"
              required
              error={errors.registered_address}
            >
              <AdminTextarea
                id="seller-registered-address"
                value={legal.registered_address}
                onChange={(e) => setLegal({ ...legal, registered_address: e.target.value })}
                rows={2}
                placeholder="Vergi dairesine kayıtlı resmi iş yeri adresi..."
                error={errors.registered_address}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                label="KEP Adresi (Kayıtlı E-Posta)"
                htmlFor="seller-kep-address"
                required
                error={errors.kep_address}
              >
                <AdminInput
                  id="seller-kep-address"
                  value={legal.kep_address}
                  onChange={(e) => setLegal({ ...legal, kep_address: e.target.value })}
                  placeholder="ornek@hs01.kep.tr"
                  error={errors.kep_address}
                />
              </FormField>

              <FormField
                label="Resmi Ticari E-Posta"
                htmlFor="seller-business-email"
                required
                error={errors.business_email}
              >
                <AdminInput
                  id="seller-business-email"
                  type="email"
                  value={legal.business_email}
                  onChange={(e) => setLegal({ ...legal, business_email: e.target.value })}
                  placeholder="info@monocactus.com"
                  error={errors.business_email}
                />
              </FormField>

              <FormField
                label="Resmi Ticari Telefon"
                htmlFor="seller-business-phone"
                required
                error={errors.business_phone}
              >
                <AdminInput
                  id="seller-business-phone"
                  value={legal.business_phone}
                  onChange={(e) => setLegal({ ...legal, business_phone: e.target.value })}
                  placeholder="+90 (212) 555 0192"
                  error={errors.business_phone}
                />
              </FormField>
            </div>
          </div>

          {/* Section 3: Chamber & Registry Information (Optional / Sole Proprietor friendly) */}
          <div className="space-y-4 pt-4 border-t border-border-subtle">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                3. Oda & Sicil Bilgileri (İsteğe Bağlı)
              </h4>
              <span className="text-[11px] text-text-muted flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                Şahıs firmaları için MERSİS zorunlu değildir.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Kayıtlı Olunan Meslek Odası" htmlFor="seller-chamber-name">
                <AdminInput
                  id="seller-chamber-name"
                  value={legal.chamber_name || ''}
                  onChange={(e) =>
                    setLegal({ ...legal, chamber_name: e.target.value.trim() ? e.target.value : null })
                  }
                  placeholder="Örn: İstanbul Ticaret Odası"
                />
              </FormField>

              <FormField label="Oda Sicil Numarası" htmlFor="seller-chamber-reg">
                <AdminInput
                  id="seller-chamber-reg"
                  value={legal.chamber_registration_number || ''}
                  onChange={(e) =>
                    setLegal({
                      ...legal,
                      chamber_registration_number: e.target.value.trim() ? e.target.value : null,
                    })
                  }
                  placeholder="Oda kayıt sicil no"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Ticaret Sicil Numarası" htmlFor="seller-trade-reg">
                <AdminInput
                  id="seller-trade-reg"
                  value={legal.trade_registry_number || ''}
                  onChange={(e) =>
                    setLegal({
                      ...legal,
                      trade_registry_number: e.target.value.trim() ? e.target.value : null,
                    })
                  }
                  placeholder="Ticaret sicil no"
                />
              </FormField>

              <FormField
                label="MERSİS Numarası (Varsa)"
                htmlFor="seller-mersis"
              >
                <AdminInput
                  id="seller-mersis"
                  value={legal.mersis_number || ''}
                  onChange={(e) =>
                    setLegal({ ...legal, mersis_number: e.target.value.trim() ? e.target.value : null })
                  }
                  placeholder="16 haneli MERSİS no (Şahıs firmalarında boş bırakılabilir)"
                />
              </FormField>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
            <span className="text-xs text-text-muted">
              * İşaretli tüm alanlar 6502 sayılı kanun kapsamında yasal zorunluluktur.
            </span>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold rounded bg-accent-primary text-text-inverse hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Satıcı Bilgilerini Kaydet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

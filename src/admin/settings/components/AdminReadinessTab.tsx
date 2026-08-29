import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Power,
  Loader2,
  RefreshCw,
  HelpCircle,
  Layers,
  FileCheck,
  Truck,
  Mail,
  Lock,
  CreditCard,
} from 'lucide-react';
import { useToast } from '@/admin/ui';
import { adminSettingsRepository } from '../api/admin-settings-repository';
import type { CheckoutReadiness } from '@/entities/settings/types';

interface ReadinessItem {
  id: string;
  title: string;
  category: string;
  status: 'ready' | 'configured_unverified' | 'not_configured' | 'future_integration';
  statusLabel: string;
  description: string;
  note?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function AdminReadinessTab() {
  const { success, error: toastError } = useToast();
  const [readiness, setReadiness] = useState<CheckoutReadiness | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  const loadReadiness = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminSettingsRepository.getCheckoutReadiness();
      setReadiness(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Hazırlık durumu alınamadı.';
      toastError('Hata', msg);
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadReadiness();
  }, [loadReadiness]);

  const handleToggleCheckout = async () => {
    if (!readiness) return;
    const targetState = !readiness.checkout_enabled;

    if (targetState && (!readiness.seller_legal_complete || !readiness.has_active_shipping)) {
      toastError(
        'Etkinleştirilemedi',
        'Ödemeyi açabilmek için satıcı yasal bilgileri ve en az bir aktif kargo tarifesi tamamlanmalıdır.'
      );
      return;
    }

    setIsToggling(true);
    try {
      const result = await adminSettingsRepository.setCheckoutEnabled(targetState);
      if (result.success) {
        success(
          'Başarılı',
          targetState
            ? 'Ödeme ve sipariş altyapısı başarıyla CANLIYA alındı.'
            : 'Ödeme ve sipariş altyapısı devre dışı bırakıldı.'
        );
        await loadReadiness();
      } else {
        toastError('İşlem Başarısız', result.error || 'Ayar güncellenemedi.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ayar güncellenemedi.';
      toastError('Hata', msg);
    } finally {
      setIsToggling(false);
    }
  };

  const checklist: ReadinessItem[] = [
    {
      id: 'seller_legal',
      title: 'Satıcı Yasal Kimlik Bilgileri',
      category: 'Hukuki Uyum',
      status: readiness?.seller_legal_complete ? 'ready' : 'not_configured',
      statusLabel: readiness?.seller_legal_complete ? 'Hazır' : 'Eksik Bilgiler Var',
      description:
        '6502 sayılı Tüketicinin Korunması Kanunu kapsamındaki 9 zorunlu alan (unvan, vergi no, kayıtlı adres, KEP, e-posta, telefon vb.).',
      icon: FileCheck,
    },
    {
      id: 'shipping',
      title: 'Kargo & Teslimat Tarifeleri',
      category: 'Lojistik Altyapı',
      status: readiness?.has_active_shipping ? 'ready' : 'not_configured',
      statusLabel: readiness?.has_active_shipping ? 'Hazır' : 'Aktif Tarife Yok',
      description:
        'Sipariş oluşturulabilmesi için en az 1 aktif teslimat bölgesi ve geçerli kargo tarifesi tanımlı.',
      icon: Truck,
    },
    {
      id: 'google_auth',
      title: 'Müşteri Google Kimlik Doğrulama',
      category: 'Güvenlik & Oturum',
      status: 'ready',
      statusLabel: 'Hazır',
      description:
        'Google OAuth 2.0 PKCE akışı, güvenli yönlendirme filtreleri ve müşteri profil bağlama.',
      icon: Lock,
    },
    {
      id: 'paytr_gateway',
      title: 'PayTR Güvenli Ödeme Geçidi',
      category: 'Ödeme Altyapısı',
      status:
        readiness?.paytr_secrets_present === true
          ? 'configured_unverified'
          : readiness?.paytr_secrets_present === false
          ? 'not_configured'
          : 'configured_unverified',
      statusLabel:
        readiness?.paytr_secrets_present === false
          ? 'Yapılandırılmadı'
          : 'Yapılandırıldı (Harici Doğrulama Bekliyor)',
      description:
        'PayTR Merchant ID, Merchant Key ve Merchant Salt HMAC-SHA256 imzalama.',
      note: 'Yurtdışı kart kabulü PayTR üye işyeri panelinden ayrıca talep edilmeli ve teyit edilmelidir.',
      icon: CreditCard,
    },
    {
      id: 'paytr_callback',
      title: 'PayTR Callback Güvenli Uç Noktası',
      category: 'Ödeme Altyapısı',
      status: 'ready',
      statusLabel: 'Hazır',
      description:
        'HMAC doğrulamalı webhook işleyici, atomik bakiye/sipariş kesinleştirme ve stok onaylama.',
      icon: ShieldCheck,
    },
    {
      id: 'transactional_email',
      title: 'İşlemsel E-Posta Bildirim Servisi',
      category: 'Bildirim Servisi',
      status:
        readiness?.gmail_secrets_present === true
          ? 'configured_unverified'
          : readiness?.gmail_secrets_present === false
          ? 'not_configured'
          : 'configured_unverified',
      statusLabel:
        readiness?.gmail_secrets_present === false
          ? 'Yapılandırılmadı'
          : 'Yapılandırıldı (Harici Doğrulama Bekliyor)',
      description:
        'Sipariş onayı ve ödeme bilgilendirme e-postaları (Transactional Outbox kuyruk mekanizması).',
      icon: Mail,
    },
    {
      id: 'e_invoice',
      title: 'E-Fatura & E-Arşiv Entegrasyonu',
      category: 'Maliye & Muhasebe',
      status: 'future_integration',
      statusLabel: 'Gelecek Entegrasyon',
      description:
        'E-Fatura entegrasyonu henüz bağlı değil — Satışlar için manuel e-Arşiv / serbest meslek makbuzu düzenlenir.',
      note: 'Sistemde sahte GİB/e-Arşiv belgesi üretilmez; gerçek entegrasyon sonraki fazda eklenecektir.',
      icon: Layers,
    },
  ];

  const getBadgeClass = (status: ReadinessItem['status']) => {
    switch (status) {
      case 'ready':
        return 'bg-feedback-success/15 text-feedback-success border-feedback-success/30';
      case 'configured_unverified':
        return 'bg-feedback-info/15 text-feedback-info border-feedback-info/30';
      case 'not_configured':
        return 'bg-feedback-error/15 text-feedback-error border-feedback-error/30';
      case 'future_integration':
        return 'bg-surface-muted text-text-secondary border-border-default';
    }
  };

  const isEligibleToEnable = Boolean(
    readiness?.seller_legal_complete && readiness?.has_active_shipping
  );

  return (
    <div className="space-y-6 text-left">
      {/* Top Activation Switch Box */}
      <div className="bg-surface-primary border border-border-default rounded-lg p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Power
                className={`w-5 h-5 ${
                  readiness?.checkout_enabled ? 'text-feedback-success' : 'text-text-muted'
                }`}
              />
              <h3 className="text-base font-semibold text-text-primary">
                Canlı Ödeme & Sipariş Altyapısı
              </h3>
            </div>
            <p className="text-xs text-text-secondary">
              Mağaza müşterilerinin sepette ödeme adımına geçip sipariş oluşturabilmesini kontrol eder.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadReadiness}
              disabled={isLoading}
              className="p-2 rounded border border-border-default bg-surface-primary text-text-secondary hover:text-text-primary transition-colors"
              title="Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              disabled={isToggling || (!isEligibleToEnable && !readiness?.checkout_enabled)}
              onClick={handleToggleCheckout}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded text-xs font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed ${
                readiness?.checkout_enabled
                  ? 'bg-feedback-danger text-text-inverse hover:bg-feedback-danger/90'
                  : 'bg-feedback-success text-text-inverse hover:bg-feedback-success/90'
              }`}
            >
              {isToggling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Power className="w-4 h-4" />
              )}
              <span>
                {readiness?.checkout_enabled ? 'Ödemeyi Kapat (Devre Dışı)' : 'Ödemeyi Canlıya Aç'}
              </span>
            </button>
          </div>
        </div>

        {/* Current State Banner */}
        <div
          className={`p-4 rounded border text-xs flex items-start gap-3 ${
            readiness?.checkout_enabled
              ? 'bg-feedback-success/10 border-feedback-success/30 text-feedback-success'
              : 'bg-surface-secondary border-border-default text-text-secondary'
          }`}
        >
          {readiness?.checkout_enabled ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-feedback-warning" />
          )}
          <div className="space-y-0.5">
            <span className="font-semibold block">
              {readiness?.checkout_enabled
                ? 'Ödeme Altyapısı CANLI: Müşteriler PayTR üzerinden güvenli ödeme yapabilir.'
                : 'Ödeme Altyapısı KAPALI: Vitrinde müşterilere geçici olarak sipariş alınamadığı bilgisi gösterilir.'}
            </span>
            {!isEligibleToEnable && !readiness?.checkout_enabled && (
              <span className="text-feedback-error block pt-1">
                ⚠️ Ödemeyi açabilmek için lütfen "Satıcı / Yasal Bilgiler" formundaki tüm zorunlu alanları ve Kargo modülündeki tarifeleri tamamlayın.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Integration Readiness Checklist */}
      <div className="bg-surface-primary border border-border-default rounded-lg p-6 shadow-xs space-y-4">
        <div className="border-b border-border-subtle pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              Entegrasyon & Güvenlik Hazırlık Durumu
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Üretim öncesi servis, anahtar ve hukuki bileşen kontrol listesi.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-text-muted">
            <span className="inline-block w-2 h-2 rounded-full bg-feedback-success" /> Hazır
            <span className="inline-block w-2 h-2 rounded-full bg-feedback-info ml-2" /> Yapılandırıldı
            <span className="inline-block w-2 h-2 rounded-full bg-feedback-error ml-2" /> Eksik
          </div>
        </div>

        <div className="divide-y divide-border-subtle">
          {checklist.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded bg-surface-secondary flex items-center justify-center text-text-primary shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-text-primary">{item.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-muted text-text-muted">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{item.description}</p>
                    {item.note && (
                      <p className="text-[11px] text-text-muted flex items-center gap-1 pt-0.5">
                        <HelpCircle className="w-3 h-3 text-feedback-info shrink-0" />
                        <span>{item.note}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded border ${getBadgeClass(
                      item.status
                    )}`}
                  >
                    {item.statusLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

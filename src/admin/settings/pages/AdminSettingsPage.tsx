import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Building,
  Mail,
  Truck,
  Share2,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { AdminPageHeader, useToast } from '@/admin/ui';
import { adminSettingsRepository } from '../api/admin-settings-repository';
import { AdminGeneralSettingsTab } from '../components/AdminGeneralSettingsTab';
import { AdminContactSettingsTab } from '../components/AdminContactSettingsTab';
import { AdminCommerceSettingsTab } from '../components/AdminCommerceSettingsTab';
import { AdminSocialSettingsTab } from '../components/AdminSocialSettingsTab';
import { AdminSellerLegalTab } from '../components/AdminSellerLegalTab';
import { AdminReadinessTab } from '../components/AdminReadinessTab';
import {
  PublicSiteSettings,
  DEFAULT_PUBLIC_SITE_SETTINGS,
  SellerLegalSettings,
  DEFAULT_SELLER_LEGAL,
} from '@/entities/settings/types';

type SettingsTab = 'general' | 'contact' | 'commerce' | 'social' | 'seller_legal' | 'readiness';

export function AdminSettingsPage() {
  const { error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isLoading, setIsLoading] = useState(true);

  const [settings, setSettings] = useState<PublicSiteSettings>(DEFAULT_PUBLIC_SITE_SETTINGS);
  const [sellerLegal, setSellerLegal] = useState<SellerLegalSettings>(DEFAULT_SELLER_LEGAL);

  const loadAllSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const [siteData, legalData] = await Promise.all([
        adminSettingsRepository.getSettings(),
        adminSettingsRepository.getSellerLegal().catch(() => DEFAULT_SELLER_LEGAL),
      ]);
      setSettings(siteData);
      setSellerLegal(legalData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ayarlar yüklenemedi.';
      toastError('Hata', msg);
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadAllSettings();
  }, [loadAllSettings]);

  const tabs: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'general', label: 'Genel Marka', icon: Building },
    { id: 'contact', label: 'İletişim & Showroom', icon: Mail },
    { id: 'commerce', label: 'Kargo & E-Ticaret', icon: Truck },
    { id: 'social', label: 'Sosyal Medya', icon: Share2 },
    { id: 'seller_legal', label: 'Satıcı / Yasal Bilgiler', icon: Scale },
    { id: 'readiness', label: 'Entegrasyon Hazırlığı', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Sistem & Site Ayarları"
        description="Marka kimliği, yasal satıcı profili, PayTR ödeme hazırlığı ve e-ticaret parametreleri."
        actions={
          <button
            type="button"
            onClick={loadAllSettings}
            className="p-2 rounded border border-border-default bg-surface-primary text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      {/* Settings Navigation Tabs */}
      <div className="border-b border-border-subtle flex gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-text-primary text-text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-default'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-text-muted bg-surface-primary border border-border-default rounded-lg">
          Ayarlar yükleniyor...
        </div>
      ) : (
        <div>
          {activeTab === 'general' && (
            <AdminGeneralSettingsTab
              initialData={settings.general}
              onSaved={(newGeneral) => setSettings({ ...settings, general: newGeneral })}
            />
          )}

          {activeTab === 'contact' && (
            <AdminContactSettingsTab
              initialData={settings.contact}
              onSaved={(newContact) => setSettings({ ...settings, contact: newContact })}
            />
          )}

          {activeTab === 'commerce' && (
            <AdminCommerceSettingsTab
              initialData={settings.commerce}
              onSaved={(newCommerce) => setSettings({ ...settings, commerce: newCommerce })}
            />
          )}

          {activeTab === 'social' && (
            <AdminSocialSettingsTab
              initialData={settings.social}
              onSaved={(newSocial) => setSettings({ ...settings, social: newSocial })}
            />
          )}

          {activeTab === 'seller_legal' && (
            <AdminSellerLegalTab
              initialData={sellerLegal}
              onSaved={(newLegal) => setSellerLegal(newLegal)}
            />
          )}

          {activeTab === 'readiness' && <AdminReadinessTab />}
        </div>
      )}
    </div>
  );
}

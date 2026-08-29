import React, { useState } from 'react';
import { Truck, Save, Loader2 } from 'lucide-react';
import { FormField, AdminInput, useToast } from '@/admin/ui';
import { adminSettingsRepository } from '../api/admin-settings-repository';
import type { CommerceSettings } from '@/entities/settings/types';

interface AdminCommerceSettingsTabProps {
  initialData: CommerceSettings;
  onSaved?: (data: CommerceSettings) => void;
}

export function AdminCommerceSettingsTab({ initialData, onSaved }: AdminCommerceSettingsTabProps) {
  const { success, error: toastError } = useToast();
  const [commerce, setCommerce] = useState<CommerceSettings>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (commerce.freeShippingThreshold < 0) {
      errs.freeShippingThreshold = 'Ücretsiz kargo limiti 0 veya daha büyük olmalıdır.';
    }
    if (!commerce.shippingEstimateText.trim()) {
      errs.shippingEstimateText = 'Kargo bilgilendirme metni zorunludur.';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSaving(true);
    try {
      await adminSettingsRepository.updateCommerceSettings(commerce);
      success('Başarılı', 'E-Ticaret ve kargo parametreleri kaydedildi.');
      onSaved?.(commerce);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kaydedilemedi.';
      toastError('Hata', msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-surface-primary border border-border-default rounded-lg p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3 text-left">
        <Truck className="w-4 h-4 text-accent-primary" />
        <h3 className="text-sm font-semibold text-text-primary">E-Ticaret & Kargo Parametreleri</h3>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4 text-left">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Ücretsiz Kargo Limiti (TL)"
            htmlFor="free-shipping-limit"
            required
            error={errors.freeShippingThreshold}
          >
            <AdminInput
              id="free-shipping-limit"
              type="number"
              value={commerce.freeShippingThreshold}
              onChange={(e) =>
                setCommerce({ ...commerce, freeShippingThreshold: Number(e.target.value) || 0 })
              }
              error={errors.freeShippingThreshold}
            />
          </FormField>

          <FormField
            label="Kargo Hesaplama Notu"
            htmlFor="shipping-estimate"
            required
            error={errors.shippingEstimateText}
          >
            <AdminInput
              id="shipping-estimate"
              value={commerce.shippingEstimateText}
              onChange={(e) => setCommerce({ ...commerce, shippingEstimateText: e.target.value })}
              placeholder="Örn: Ödeme adımında hesaplanır"
              error={errors.shippingEstimateText}
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
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded bg-accent-primary text-text-inverse hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Kargo Ayarlarını Kaydet</span>
          </button>
        </div>
      </form>
    </div>
  );
}

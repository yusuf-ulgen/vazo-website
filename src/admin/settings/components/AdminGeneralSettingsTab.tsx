import React, { useState } from 'react';
import { Building, Save, Loader2 } from 'lucide-react';
import { FormField, AdminInput, AdminTextarea, useToast } from '@/admin/ui';
import { adminSettingsRepository } from '../api/admin-settings-repository';
import type { GeneralSettings } from '@/entities/settings/types';

interface AdminGeneralSettingsTabProps {
  initialData: GeneralSettings;
  onSaved?: (data: GeneralSettings) => void;
}

export function AdminGeneralSettingsTab({ initialData, onSaved }: AdminGeneralSettingsTabProps) {
  const { success, error: toastError } = useToast();
  const [general, setGeneral] = useState<GeneralSettings>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!general.brandName.trim()) errs.brandName = 'Marka adı zorunludur.';
    if (!general.tagline.trim()) errs.tagline = 'Slogan zorunludur.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSaving(true);
    try {
      await adminSettingsRepository.updateGeneralSettings(general);
      success('Başarılı', 'Genel marka ayarları kaydedildi.');
      onSaved?.(general);
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
        <Building className="w-4 h-4 text-accent-primary" />
        <h3 className="text-sm font-semibold text-text-primary">Genel Marka Kimliği</h3>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4 text-left">
        <FormField label="Marka Adı" htmlFor="brand-name" required error={errors.brandName}>
          <AdminInput
            id="brand-name"
            value={general.brandName}
            onChange={(e) => setGeneral({ ...general, brandName: e.target.value })}
            placeholder="Örn: Monocactus / Vazo Studio"
            error={errors.brandName}
          />
        </FormField>

        <FormField label="Slogan / Tagline" htmlFor="brand-tagline" required error={errors.tagline}>
          <AdminInput
            id="brand-tagline"
            value={general.tagline}
            onChange={(e) => setGeneral({ ...general, tagline: e.target.value })}
            placeholder="Örn: Heykelsi Formlar & Çağdaş Seramik Tasarımlar"
            error={errors.tagline}
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
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded bg-accent-primary text-text-inverse hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Genel Ayarları Kaydet</span>
          </button>
        </div>
      </form>
    </div>
  );
}

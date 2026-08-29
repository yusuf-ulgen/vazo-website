import React, { useState } from 'react';
import { Share2, Save, Loader2 } from 'lucide-react';
import { FormField, AdminInput, useToast } from '@/admin/ui';
import { adminSettingsRepository } from '../api/admin-settings-repository';
import type { SocialSettings } from '@/entities/settings/types';

interface AdminSocialSettingsTabProps {
  initialData: SocialSettings;
  onSaved?: (data: SocialSettings) => void;
}

export function AdminSocialSettingsTab({ initialData, onSaved }: AdminSocialSettingsTabProps) {
  const { success, error: toastError } = useToast();
  const [social, setSocial] = useState<SocialSettings>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
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
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSaving(true);
    try {
      await adminSettingsRepository.updateSocialSettings(social);
      success('Başarılı', 'Sosyal medya bağlantıları kaydedildi.');
      onSaved?.(social);
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
        <Share2 className="w-4 h-4 text-accent-primary" />
        <h3 className="text-sm font-semibold text-text-primary">Sosyal Medya Bağlantıları</h3>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4 text-left">
        <FormField label="Instagram URL" htmlFor="social-instagram" error={errors.instagram}>
          <AdminInput
            id="social-instagram"
            value={social.instagram}
            onChange={(e) => setSocial({ ...social, instagram: e.target.value })}
            placeholder="https://instagram.com/monocactus"
            error={errors.instagram}
          />
        </FormField>

        <FormField label="Facebook URL" htmlFor="social-facebook" error={errors.facebook}>
          <AdminInput
            id="social-facebook"
            value={social.facebook}
            onChange={(e) => setSocial({ ...social, facebook: e.target.value })}
            placeholder="https://facebook.com/monocactus"
            error={errors.facebook}
          />
        </FormField>

        <FormField label="Pinterest URL" htmlFor="social-pinterest" error={errors.pinterest}>
          <AdminInput
            id="social-pinterest"
            value={social.pinterest}
            onChange={(e) => setSocial({ ...social, pinterest: e.target.value })}
            placeholder="https://pinterest.com/monocactus"
            error={errors.pinterest}
          />
        </FormField>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded bg-accent-primary text-text-inverse hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Sosyal Medyayı Kaydet</span>
          </button>
        </div>
      </form>
    </div>
  );
}

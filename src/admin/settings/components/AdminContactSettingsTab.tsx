import React, { useState } from 'react';
import { Mail, Save, Loader2 } from 'lucide-react';
import { FormField, AdminInput, AdminTextarea, useToast } from '@/admin/ui';
import { adminSettingsRepository } from '../api/admin-settings-repository';
import type { ContactSettings } from '@/entities/settings/types';

interface AdminContactSettingsTabProps {
  initialData: ContactSettings;
  onSaved?: (data: ContactSettings) => void;
}

export function AdminContactSettingsTab({ initialData, onSaved }: AdminContactSettingsTabProps) {
  const { success, error: toastError } = useToast();
  const [contact, setContact] = useState<ContactSettings>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
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
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSaving(true);
    try {
      await adminSettingsRepository.updateContactSettings(contact);
      success('Başarılı', 'İletişim ve showroom ayarları kaydedildi.');
      onSaved?.(contact);
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
        <Mail className="w-4 h-4 text-accent-primary" />
        <h3 className="text-sm font-semibold text-text-primary">İletişim & Showroom Bilgileri</h3>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4 text-left">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Genel Destek E-Posta" htmlFor="contact-email" required error={errors.email}>
            <AdminInput
              id="contact-email"
              type="email"
              value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
              placeholder="info@monocactus.com"
              error={errors.email}
            />
          </FormField>

          <FormField label="Toptan / Trade E-Posta" htmlFor="wholesale-email" required error={errors.wholesaleEmail}>
            <AdminInput
              id="wholesale-email"
              type="email"
              value={contact.wholesaleEmail}
              onChange={(e) => setContact({ ...contact, wholesaleEmail: e.target.value })}
              placeholder="toptan@monocactus.com"
              error={errors.wholesaleEmail}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Telefon / WhatsApp" htmlFor="contact-phone" required error={errors.phone}>
            <AdminInput
              id="contact-phone"
              value={contact.phone}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              placeholder="+90 (212) 555 0192"
              error={errors.phone}
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

        <FormField label="Showroom & Atölye Adresi" htmlFor="contact-address" required error={errors.address}>
          <AdminTextarea
            id="contact-address"
            value={contact.address}
            onChange={(e) => setContact({ ...contact, address: e.target.value })}
            rows={2}
            placeholder="Atölye veya showroom fiziksel adresi..."
            error={errors.address}
          />
        </FormField>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded bg-accent-primary text-text-inverse hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>İletişim Bilgilerini Kaydet</span>
          </button>
        </div>
      </form>
    </div>
  );
}

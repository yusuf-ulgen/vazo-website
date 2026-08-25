import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';
import { FormField, AdminInput, AdminTextarea, AdminSelect, useToast } from '@/admin/ui';
import { adminContentRepository } from '../api/admin-content-repository';
import type { AdminWholesaleBenefit } from '../types';

interface WholesaleBenefitModalProps {
  isOpen: boolean;
  benefit: AdminWholesaleBenefit | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ALLOWED_ICONS = [
  { value: 'Tag', label: 'Etiket / İndirim (Tag)' },
  { value: 'Boxes', label: 'Kutular / Ürün Çeşitliliği (Boxes)' },
  { value: 'Award', label: 'Ödül / Kalite (Award)' },
  { value: 'Truck', label: 'Kamyon / Hızlı Kargo (Truck)' },
  { value: 'Headphones', label: 'Kulaklık / Destek (Headphones)' },
  { value: 'Building2', label: 'Bina / Mimari Proje (Building2)' },
  { value: 'PackageCheck', label: 'Paket / MOQ (PackageCheck)' },
  { value: 'Palette', label: 'Palet / Renk Seçenekleri (Palette)' },
  { value: 'ShieldCheck', label: 'Kalkan / Güvence (ShieldCheck)' },
  { value: 'Zap', label: 'Şimşek / Hız (Zap)' },
  { value: 'Sparkles', label: 'Işıltı / Özel Üretim (Sparkles)' },
];

export function WholesaleBenefitModal({ isOpen, benefit, onClose, onSuccess }: WholesaleBenefitModalProps) {
  const { success, error: toastError } = useToast();
  const modalRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [iconName, setIconName] = useState('Tag');
  const [sortOrder, setSortOrder] = useState('1');
  const [active, setActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (benefit) {
      setTitle(benefit.title);
      setDescription(benefit.description);
      setIconName(benefit.icon_name || 'Tag');
      setSortOrder(String(benefit.sort_order));
      setActive(benefit.active);
    } else {
      setTitle('');
      setDescription('');
      setIconName('Tag');
      setSortOrder('1');
      setActive(true);
    }
    setErrors({});
  }, [benefit, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Başlık zorunludur.';
    if (!description.trim()) errs.description = 'Açıklama metni zorunludur.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (benefit) {
        await adminContentRepository.updateWholesaleBenefit(benefit.id, {
          title: title.trim(),
          description: description.trim(),
          icon_name: iconName,
          sort_order: parseInt(sortOrder, 10) || 0,
          active,
        });
        success('Başarılı', 'Ticari avantaj güncellendi.');
      } else {
        await adminContentRepository.createWholesaleBenefit({
          title: title.trim(),
          description: description.trim(),
          icon_name: iconName,
          sort_order: parseInt(sortOrder, 10) || 0,
          active,
        });
        success('Başarılı', 'Ticari avantaj oluşturuldu.');
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ticari avantaj kaydedilemedi.';
      toastError('Hata', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs" onClick={onClose} />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="benefit-modal-title"
        className="relative w-full max-w-md bg-surface-primary border border-border-default shadow-elevated z-10 flex flex-col max-h-[90vh] rounded-lg overflow-hidden animate-fade-scale text-left"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default bg-surface-secondary/50">
          <h3 id="benefit-modal-title" className="text-sm font-semibold text-text-primary">
            {benefit ? 'Ticari Avantajı Düzenle' : 'Yeni Ticari Avantaj Ekle'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form id="benefit-form" onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <FormField label="İkon Seçimi" htmlFor="benefit-icon" required>
            <AdminSelect
              id="benefit-icon"
              value={iconName}
              onChange={(e) => setIconName(e.target.value)}
            >
              {ALLOWED_ICONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </AdminSelect>
          </FormField>

          <FormField label="Başlık" htmlFor="benefit-title" required error={errors.title}>
            <AdminInput
              id="benefit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Özel Toptan Fiyatlar"
              error={errors.title}
            />
          </FormField>

          <FormField label="Açıklama" htmlFor="benefit-description" required error={errors.description}>
            <AdminTextarea
              id="benefit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Örn: Hacminize özel avantajlı fiyatlandırma."
              rows={3}
              error={errors.description}
            />
          </FormField>

          <FormField label="Sıralama (Sıra No)" htmlFor="benefit-sort-order">
            <AdminInput
              id="benefit-sort-order"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </FormField>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="benefit-active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded border-border-default text-accent-primary focus:ring-accent-primary"
            />
            <label htmlFor="benefit-active" className="text-xs font-medium text-text-primary cursor-pointer">
              Aktif (Yayında)
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-default bg-surface-secondary/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded border border-border-default text-text-secondary hover:bg-surface-secondary transition-colors"
          >
            İptal
          </button>
          <button
            type="submit"
            form="benefit-form"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded bg-accent-primary text-text-inverse hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{benefit ? 'Güncelle' : 'Kaydet'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

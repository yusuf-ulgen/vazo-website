import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { FormField, AdminInput, useToast } from '@/admin/ui';
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap';
import { adminNavigationRepository } from '../api/admin-navigation-repository';
import type { AdminMenuItem } from '../types';

interface MenuItemModalProps {
  isOpen: boolean;
  groupId: string;
  item: AdminMenuItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function MenuItemModal({
  isOpen,
  groupId,
  item,
  onClose,
  onSuccess,
}: MenuItemModalProps) {
  const { success, error: toastError } = useToast();

  const { containerRef } = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });

  const [label, setLabel] = useState('');
  const [href, setHref] = useState('');
  const [sortOrder, setSortOrder] = useState('1');
  const [isNew, setIsNew] = useState(false);
  const [isPopular, setIsPopular] = useState(false);
  const [active, setActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      setLabel(item.label);
      setHref(item.href);
      setSortOrder(String(item.sort_order));
      setIsNew(item.is_new);
      setIsPopular(item.is_popular);
      setActive(item.active);
    } else {
      setLabel('');
      setHref('');
      setSortOrder('1');
      setIsNew(false);
      setIsPopular(false);
      setActive(true);
    }
    setErrors({});
  }, [item, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!label.trim()) errs.label = 'Bağlantı başlığı (Etiket) zorunludur.';
    if (!href.trim()) errs.href = 'Bağlantı linki (URL/Path) zorunludur.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (item) {
        await adminNavigationRepository.updateMenuItem(item.id, {
          label: label.trim(),
          href: href.trim(),
          sort_order: parseInt(sortOrder, 10) || 0,
          is_new: isNew,
          is_popular: isPopular,
          active,
        });
        success('Başarılı', 'Menü bağlantısı güncellendi.');
      } else {
        await adminNavigationRepository.createMenuItem({
          group_id: groupId,
          label: label.trim(),
          href: href.trim(),
          sort_order: parseInt(sortOrder, 10) || 0,
          is_new: isNew,
          is_popular: isPopular,
          active,
        });
        success('Başarılı', 'Menü bağlantısı oluşturuldu.');
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Menü bağlantısı kaydedilemedi.';
      toastError('Hata', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs" onClick={onClose} />
      <div
        ref={containerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-modal-title"
        className="relative w-full max-w-md bg-surface-primary border border-border-default shadow-elevated z-10 flex flex-col max-h-[90vh] rounded-lg overflow-hidden animate-fade-scale text-left focus:outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default bg-surface-secondary/50">
          <h3 id="item-modal-title" className="text-sm font-semibold text-text-primary">
            {item ? 'Menü Bağlantısını Düzenle' : 'Yeni Menü Bağlantısı Ekle'}
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
        <form id="menu-item-form" onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <FormField label="Bağlantı Başlığı (Etiket)" htmlFor="item-label" required error={errors.label}>
            <AdminInput
              id="item-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Örn: Masa Üstü Vazolar, Yeni Gelenler"
              error={errors.label}
            />
          </FormField>

          <FormField label="Hedef Link (URL / Path)" htmlFor="item-href" required error={errors.href}>
            <AdminInput
              id="item-href"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              placeholder="Örn: /products?category=tabletop"
              error={errors.href}
            />
          </FormField>

          <FormField label="Sıralama (Sıra No)" htmlFor="item-sort-order">
            <AdminInput
              id="item-sort-order"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </FormField>

          <div className="space-y-2 pt-2 border-t border-border-subtle">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="item-is-new"
                checked={isNew}
                onChange={(e) => setIsNew(e.target.checked)}
                className="w-4 h-4 rounded border-border-default text-accent-primary focus:ring-accent-primary"
              />
              <label htmlFor="item-is-new" className="text-xs font-medium text-text-primary cursor-pointer">
                "YENİ" etiketi göster
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="item-is-popular"
                checked={isPopular}
                onChange={(e) => setIsPopular(e.target.checked)}
                className="w-4 h-4 rounded border-border-default text-accent-primary focus:ring-accent-primary"
              />
              <label htmlFor="item-is-popular" className="text-xs font-medium text-text-primary cursor-pointer">
                "POPÜLER" etiketi göster
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="item-active"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 rounded border-border-default text-accent-primary focus:ring-accent-primary"
              />
              <label htmlFor="item-active" className="text-xs font-medium text-text-primary cursor-pointer">
                Bağlantı aktif (yayında) olsun
              </label>
            </div>
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
            form="menu-item-form"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded bg-accent-primary text-text-inverse hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{item ? 'Güncelle' : 'Kaydet'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

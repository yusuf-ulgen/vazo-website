import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Sparkles } from 'lucide-react';
import { FormField, AdminInput, AdminSelect, useToast } from '@/admin/ui';
import { AssetUploadButton } from '@/admin/media/components/AssetUploadButton';
import { adminNavigationRepository } from '../api/admin-navigation-repository';
import type { AdminMenuGroup, MenuType } from '../types';

interface MenuGroupModalProps {
  isOpen: boolean;
  group: AdminMenuGroup | null;
  defaultMenuType?: MenuType;
  onClose: () => void;
  onSuccess: () => void;
}

export function MenuGroupModal({
  isOpen,
  group,
  defaultMenuType = 'retail_mega',
  onClose,
  onSuccess,
}: MenuGroupModalProps) {
  const { success, error: toastError } = useToast();
  const modalRef = useRef<HTMLDivElement>(null);

  const [menuType, setMenuType] = useState<MenuType>(defaultMenuType);
  const [title, setTitle] = useState('');
  const [sortOrder, setSortOrder] = useState('1');
  const [active, setActive] = useState(true);

  // Promo Fields
  const [hasPromo, setHasPromo] = useState(false);
  const [promoTitle, setPromoTitle] = useState('');
  const [promoSubtitle, setPromoSubtitle] = useState('');
  const [promoImageUrl, setPromoImageUrl] = useState('');
  const [promoCtaText, setPromoCtaText] = useState('Keşfet');
  const [promoCtaUrl, setPromoCtaUrl] = useState('/products');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (group) {
      setMenuType(group.menu_type);
      setTitle(group.title);
      setSortOrder(String(group.sort_order));
      setActive(group.active);

      const promoExists = Boolean(group.promo_title || group.promo_image_url);
      setHasPromo(promoExists);
      setPromoTitle(group.promo_title || '');
      setPromoSubtitle(group.promo_subtitle || '');
      setPromoImageUrl(group.promo_image_url || '');
      setPromoCtaText(group.promo_cta_text || 'Keşfet');
      setPromoCtaUrl(group.promo_cta_url || '/products');
    } else {
      setMenuType(defaultMenuType);
      setTitle('');
      setSortOrder('1');
      setActive(true);

      setHasPromo(false);
      setPromoTitle('');
      setPromoSubtitle('');
      setPromoImageUrl('');
      setPromoCtaText('Keşfet');
      setPromoCtaUrl('/products');
    }
    setErrors({});
  }, [group, defaultMenuType, isOpen]);

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
    if (!title.trim()) errs.title = 'Grup başlığı zorunludur.';
    if (hasPromo) {
      if (!promoTitle.trim()) errs.promoTitle = 'Promosyon başlığı zorunludur.';
      if (!promoCtaText.trim()) errs.promoCtaText = 'Buton metni zorunludur.';
      if (!promoCtaUrl.trim()) errs.promoCtaUrl = 'Buton linki zorunludur.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (group) {
        await adminNavigationRepository.updateMenuGroup(group.id, {
          menu_type: menuType,
          title: title.trim(),
          sort_order: parseInt(sortOrder, 10) || 0,
          active,
          promo_title: hasPromo ? promoTitle.trim() : null,
          promo_subtitle: hasPromo ? promoSubtitle.trim() || null : null,
          promo_image_url: hasPromo ? promoImageUrl.trim() || null : null,
          promo_cta_text: hasPromo ? promoCtaText.trim() || null : null,
          promo_cta_url: hasPromo ? promoCtaUrl.trim() || null : null,
        });
        success('Başarılı', 'Menü grubu güncellendi.');
      } else {
        await adminNavigationRepository.createMenuGroup({
          menu_type: menuType,
          title: title.trim(),
          sort_order: parseInt(sortOrder, 10) || 0,
          active,
          promo_title: hasPromo ? promoTitle.trim() : null,
          promo_subtitle: hasPromo ? promoSubtitle.trim() || null : null,
          promo_image_url: hasPromo ? promoImageUrl.trim() || null : null,
          promo_cta_text: hasPromo ? promoCtaText.trim() || null : null,
          promo_cta_url: hasPromo ? promoCtaUrl.trim() || null : null,
        });
        success('Başarılı', 'Menü grubu oluşturuldu.');
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Menü grubu kaydedilemedi.';
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
        aria-labelledby="group-modal-title"
        className="relative w-full max-w-lg bg-surface-primary border border-border-default shadow-elevated z-10 flex flex-col max-h-[90vh] rounded-lg overflow-hidden animate-fade-scale text-left"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default bg-surface-secondary/50">
          <h3 id="group-modal-title" className="text-sm font-semibold text-text-primary">
            {group ? 'Menü Grubunu Düzenle' : 'Yeni Menü Grubu Ekle'}
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
        <form id="menu-group-form" onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Menü Alanı / Türü" htmlFor="menu-type" required>
              <AdminSelect
                id="menu-type"
                value={menuType}
                onChange={(e) => setMenuType(e.target.value as MenuType)}
              >
                <option value="retail_mega">Perakende Mega Menü</option>
                <option value="wholesale_mega">Toptan Mega Menü</option>
                <option value="primary">Ana Gezinme (Desktop/Mobil)</option>
                <option value="footer">Altbilgi (Footer)</option>
              </AdminSelect>
            </FormField>

            <FormField label="Sıralama (Sıra No)" htmlFor="group-sort-order">
              <AdminInput
                id="group-sort-order"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Grup Başlığı" htmlFor="group-title" required error={errors.title}>
            <AdminInput
              id="group-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Kategoriler, Materyal & Doku"
              error={errors.title}
            />
          </FormField>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="group-active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded border-border-default text-accent-primary focus:ring-accent-primary"
            />
            <label htmlFor="group-active" className="text-xs font-medium text-text-primary cursor-pointer">
              Grup aktif (yayında) olsun
            </label>
          </div>

          {/* Promo Card Section (Only for mega menus) */}
          {(menuType === 'retail_mega' || menuType === 'wholesale_mega') && (
            <div className="pt-4 border-t border-border-subtle space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent-primary" />
                  <span className="text-xs font-semibold text-text-primary">
                    Sağ Taraf Promosyon Kartı
                  </span>
                </div>
                <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasPromo}
                    onChange={(e) => setHasPromo(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-border-default text-accent-primary"
                  />
                  <span>Promosyon Kartı Ekle</span>
                </label>
              </div>

              {hasPromo && (
                <div className="space-y-3 bg-surface-secondary/40 p-4 rounded border border-border-subtle">
                  <FormField label="Promosyon Başlığı" htmlFor="promo-title" required error={errors.promoTitle}>
                    <AdminInput
                      id="promo-title"
                      value={promoTitle}
                      onChange={(e) => setPromoTitle(e.target.value)}
                      placeholder="Örn: Yeni Sezon: Nordik Sessizlik"
                      error={errors.promoTitle}
                    />
                  </FormField>

                  <FormField label="Promosyon Açıklaması" htmlFor="promo-subtitle">
                    <AdminInput
                      id="promo-subtitle"
                      value={promoSubtitle}
                      onChange={(e) => setPromoSubtitle(e.target.value)}
                      placeholder="Örn: Heykelsi silüetler ve mineral mat sırlı yüzeyler."
                    />
                  </FormField>

                  <FormField label="Görsel URL" htmlFor="promo-image-url">
                    <div className="flex gap-2">
                      <AdminInput
                        id="promo-image-url"
                        value={promoImageUrl}
                        onChange={(e) => setPromoImageUrl(e.target.value)}
                        placeholder="https://... veya görsel yükleyin"
                      />
                      <AssetUploadButton
                        prefix="cms"
                        onUploaded={(url) => setPromoImageUrl(url)}
                        label="Yükle"
                      />
                    </div>
                    {promoImageUrl && (
                      <div className="mt-2 relative w-full h-24 bg-surface-secondary rounded overflow-hidden border border-border-default">
                        <img src={promoImageUrl} alt="Önizleme" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </FormField>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Buton Metni" htmlFor="promo-cta-text" required error={errors.promoCtaText}>
                      <AdminInput
                        id="promo-cta-text"
                        value={promoCtaText}
                        onChange={(e) => setPromoCtaText(e.target.value)}
                        placeholder="Örn: Keşfet"
                        error={errors.promoCtaText}
                      />
                    </FormField>

                    <FormField label="Buton Linki" htmlFor="promo-cta-url" required error={errors.promoCtaUrl}>
                      <AdminInput
                        id="promo-cta-url"
                        value={promoCtaUrl}
                        onChange={(e) => setPromoCtaUrl(e.target.value)}
                        placeholder="Örn: /collections/nordic-silence"
                        error={errors.promoCtaUrl}
                      />
                    </FormField>
                  </div>
                </div>
              )}
            </div>
          )}
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
            form="menu-group-form"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded bg-accent-primary text-text-inverse hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{group ? 'Güncelle' : 'Kaydet'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

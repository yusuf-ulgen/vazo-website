import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';
import { FormField, AdminInput, AdminTextarea, AdminSelect, useToast } from '@/admin/ui';
import { AssetUploadButton } from '@/admin/media/components/AssetUploadButton';
import { adminContentRepository } from '../api/admin-content-repository';
import type { AdminHeroSlide, HeroSlot } from '../types';

interface HeroSlideEditModalProps {
  isOpen: boolean;
  slide: AdminHeroSlide | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function HeroSlideEditModal({ isOpen, slide, onClose, onSuccess }: HeroSlideEditModalProps) {
  const { success, error: toastError } = useToast();
  const modalRef = useRef<HTMLDivElement>(null);

  const [slot, setSlot] = useState<HeroSlot>('retail');
  const [eyebrow, setEyebrow] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [primaryCtaText, setPrimaryCtaText] = useState('Alışverişe Başla');
  const [primaryCtaUrl, setPrimaryCtaUrl] = useState('/products');
  const [sortOrder, setSortOrder] = useState('1');
  const [active, setActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (slide) {
      setSlot(slide.slot || 'retail');
      setEyebrow(slide.eyebrow || '');
      setTitle(slide.title);
      setDescription(slide.description);
      setImageUrl(slide.image_url);
      setPrimaryCtaText(slide.primary_cta_text);
      setPrimaryCtaUrl(slide.primary_cta_url);
      setSortOrder(String(slide.sort_order));
      setActive(slide.active);
    } else {
      setSlot('retail');
      setEyebrow('');
      setTitle('');
      setDescription('');
      setImageUrl('');
      setPrimaryCtaText('Alışverişe Başla');
      setPrimaryCtaUrl('/products');
      setSortOrder('1');
      setActive(true);
    }
    setErrors({});
  }, [slide, isOpen]);

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
    if (!imageUrl.trim()) errs.imageUrl = 'Görsel URL zorunludur.';
    if (!primaryCtaText.trim()) errs.primaryCtaText = 'Buton metni zorunludur.';
    if (!primaryCtaUrl.trim()) errs.primaryCtaUrl = 'Buton linki zorunludur.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (slide) {
        await adminContentRepository.updateHeroSlide(slide.id, {
          slot,
          eyebrow: eyebrow.trim() || null,
          title: title.trim(),
          description: description.trim(),
          image_url: imageUrl.trim(),
          primary_cta_text: primaryCtaText.trim(),
          primary_cta_url: primaryCtaUrl.trim(),
          sort_order: parseInt(sortOrder, 10) || 0,
          active,
        });
        success('Başarılı', 'Hero slayt güncellendi.');
      } else {
        await adminContentRepository.createHeroSlide({
          slot,
          eyebrow: eyebrow.trim() || null,
          title: title.trim(),
          description: description.trim(),
          image_url: imageUrl.trim(),
          primary_cta_text: primaryCtaText.trim(),
          primary_cta_url: primaryCtaUrl.trim(),
          sort_order: parseInt(sortOrder, 10) || 0,
          active,
        });
        success('Başarılı', 'Hero slayt oluşturuldu.');
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Hero kaydedilemedi.';
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
        aria-labelledby="hero-modal-title"
        className="relative w-full max-w-lg bg-surface-primary border border-border-default shadow-elevated z-10 flex flex-col max-h-[90vh] rounded-lg overflow-hidden animate-fade-scale text-left"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default bg-surface-secondary/50">
          <h3 id="hero-modal-title" className="text-sm font-semibold text-text-primary">
            {slide ? 'Hero Vitrinini Düzenle' : 'Yeni Hero Vitrini Ekle'}
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
        <form id="hero-slide-form" onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Vitrin Alanı (Slot)" htmlFor="hero-slot" required>
              <AdminSelect
                id="hero-slot"
                value={slot}
                onChange={(e) => setSlot(e.target.value as HeroSlot)}
              >
                <option value="retail">Perakende (Sol Taraf)</option>
                <option value="wholesale">Toptan (Sağ Taraf)</option>
                <option value="general">Genel Banner</option>
              </AdminSelect>
            </FormField>

            <FormField label="Sıra Numarası" htmlFor="hero-sort-order">
              <AdminInput
                id="hero-sort-order"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Üst Başlık (Eyebrow)" htmlFor="hero-eyebrow">
            <AdminInput
              id="hero-eyebrow"
              value={eyebrow}
              onChange={(e) => setEyebrow(e.target.value)}
              placeholder="Örn: BİREYSEL ALIŞVERİŞ"
            />
          </FormField>

          <FormField label="Ana Başlık" htmlFor="hero-title" required error={errors.title}>
            <AdminInput
              id="hero-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Perakende"
              error={errors.title}
            />
          </FormField>

          <FormField label="Açıklama Metni" htmlFor="hero-description" required error={errors.description}>
            <AdminTextarea
              id="hero-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Koleksiyon açıklama metni..."
              rows={3}
              error={errors.description}
            />
          </FormField>

          <FormField label="Görsel URL" htmlFor="hero-image-url" required error={errors.imageUrl}>
            <div className="flex gap-2">
              <AdminInput
                id="hero-image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... veya yükleyin"
                error={errors.imageUrl}
              />
              <AssetUploadButton
                prefix="cms"
                onUploaded={(url: string) => setImageUrl(url)}
                label="Görsel Yükle"
              />
            </div>
            {imageUrl && (
              <div className="mt-2 relative w-full h-28 bg-surface-secondary rounded overflow-hidden border border-border-default">
                <img src={imageUrl} alt="Önizleme" className="w-full h-full object-cover" />
              </div>
            )}
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Buton Metni" htmlFor="hero-cta-text" required error={errors.primaryCtaText}>
              <AdminInput
                id="hero-cta-text"
                value={primaryCtaText}
                onChange={(e) => setPrimaryCtaText(e.target.value)}
                placeholder="Örn: Alışverişe Başla"
                error={errors.primaryCtaText}
              />
            </FormField>

            <FormField label="Buton Linki" htmlFor="hero-cta-url" required error={errors.primaryCtaUrl}>
              <AdminInput
                id="hero-cta-url"
                value={primaryCtaUrl}
                onChange={(e) => setPrimaryCtaUrl(e.target.value)}
                placeholder="Örn: /products"
                error={errors.primaryCtaUrl}
              />
            </FormField>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="hero-active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded border-border-default text-accent-primary focus:ring-accent-primary"
            />
            <label htmlFor="hero-active" className="text-xs font-medium text-text-primary cursor-pointer">
              Bu vitrin alanı yayında (Aktif) olsun
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
            form="hero-slide-form"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded bg-accent-primary text-text-inverse hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{slide ? 'Güncelle' : 'Kaydet'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

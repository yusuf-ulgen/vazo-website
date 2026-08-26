import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { FormField } from '@/admin/ui';
import { AssetUploadButton } from '@/admin/media/components/AssetUploadButton';
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap';
import type {
  AdminContentSection,
  CreateContentSectionInput,
  UpdateContentSectionInput,
} from '../types';

interface ContentSectionModalProps {
  pageId: string;
  section: AdminContentSection | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    input: CreateContentSectionInput | UpdateContentSectionInput,
    sectionId?: string
  ) => Promise<void>;
}

export function ContentSectionModal({
  pageId,
  section,
  isOpen,
  onClose,
  onSave,
}: ContentSectionModalProps) {
  const { containerRef } = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });

  const [sectionKey, setSectionKey] = useState('');
  const [eyebrow, setEyebrow] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePosition, setImagePosition] = useState<'left' | 'right'>('left');
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (section) {
      setSectionKey(section.section_key || '');
      setEyebrow(section.eyebrow || '');
      setTitle(section.title || '');
      setSubtitle(section.subtitle || '');
      setContent(section.content || '');
      setImageUrl(section.image_url || '');
      setImagePosition((section.image_position as 'left' | 'right') || 'left');
      setCtaText(section.cta_text || '');
      setCtaUrl(section.cta_url || '');
      setSortOrder(section.sort_order ?? 1);
      setActive(section.active ?? true);
      setError(null);
    } else {
      setSectionKey('');
      setEyebrow('');
      setTitle('');
      setSubtitle('');
      setContent('');
      setImageUrl('');
      setImagePosition('left');
      setCtaText('');
      setCtaUrl('');
      setSortOrder(1);
      setActive(true);
      setError(null);
    }
  }, [section]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Bölüm başlığı zorunludur.');
      return;
    }
    if (!sectionKey.trim()) {
      setError('Bölüm anahtarı (section_key) zorunludur.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (section) {
        await onSave(
          {
            section_key: sectionKey.trim(),
            eyebrow: eyebrow.trim() || null,
            title: title.trim(),
            subtitle: subtitle.trim() || null,
            content: content.trim() || null,
            image_url: imageUrl.trim() || null,
            image_position: imagePosition,
            cta_text: ctaText.trim() || null,
            cta_url: ctaUrl.trim() || null,
            sort_order: sortOrder,
            active,
          },
          section.id
        );
      } else {
        await onSave({
          page_id: pageId,
          section_key: sectionKey.trim(),
          eyebrow: eyebrow.trim() || null,
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          content: content.trim() || null,
          image_url: imageUrl.trim() || null,
          image_position: imagePosition,
          cta_text: ctaText.trim() || null,
          cta_url: ctaUrl.trim() || null,
          sort_order: sortOrder,
          active,
        });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bölüm kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in text-left"
      role="dialog"
      aria-modal="true"
      aria-labelledby="content-section-modal-title"
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className="relative w-full max-w-2xl bg-surface-primary rounded-xl shadow-elevated border border-border-default overflow-hidden flex flex-col max-h-[90vh] focus:outline-none"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-secondary/40">
          <div>
            <h2 id="content-section-modal-title" className="text-base font-semibold text-text-primary">
              {section ? 'İçerik Bölümünü Düzenle' : 'Yeni İçerik Bölümü Ekle'}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Sayfa içi yapılandırılmış metin ve görsel bloğu.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm font-sans">
          {error && (
            <div className="p-3 bg-feedback-error/10 border border-feedback-error/20 text-feedback-error rounded-md text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Bölüm Anahtarı (section_key)" required>
              <input
                type="text"
                value={sectionKey}
                onChange={(e) => setSectionKey(e.target.value)}
                className="w-full px-3 py-2 bg-surface-primary border border-border-default rounded-md text-text-primary font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
                placeholder="Örn: story_craft"
              />
            </FormField>

            <FormField label="Üst Etiket (Eyebrow)">
              <input
                type="text"
                value={eyebrow}
                onChange={(e) => setEyebrow(e.target.value)}
                className="w-full px-3 py-2 bg-surface-primary border border-border-default rounded-md text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
                placeholder="Örn: 01 / Geleneksel Zanaat"
              />
            </FormField>
          </div>

          <FormField label="Bölüm Başlığı" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-surface-primary border border-border-default rounded-md text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
              placeholder="Örn: El Tornasında Şekillenen Karakter"
            />
          </FormField>

          <FormField label="Alt Başlık (Opsiyonel)">
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3 py-2 bg-surface-primary border border-border-default rounded-md text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
              placeholder="Kısa tamamlayıcı vurgu..."
            />
          </FormField>

          <FormField label="İçerik Metni (Paragraflar)">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-surface-primary border border-border-default rounded-md text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary leading-relaxed"
              placeholder="Bölüm ana metni..."
            />
          </FormField>

          <div className="p-4 bg-surface-secondary/40 border border-border-subtle rounded-lg space-y-4">
            <h3 className="text-xs uppercase font-semibold tracking-wider text-text-secondary">
              Görsel ve Düzen
            </h3>

            <div className="space-y-2">
              <FormField label="Görsel URL">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-primary border border-border-default rounded-md text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary font-mono text-xs"
                  placeholder="https://... veya yükleyin"
                />
              </FormField>

              <div className="flex items-center gap-3">
                <AssetUploadButton
                  prefix="cms"
                  label="Görsel Yükle"
                  onUploaded={(url: string) => setImageUrl(url)}
                />
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-10 h-10 object-cover rounded border border-border-subtle"
                  />
                )}
              </div>
            </div>

            <FormField label="Görsel Yerleşimi">
              <select
                value={imagePosition}
                onChange={(e) => setImagePosition(e.target.value as 'left' | 'right')}
                className="w-full px-3 py-2 bg-surface-primary border border-border-default rounded-md text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
              >
                <option value="left">Sol Taraf (Left)</option>
                <option value="right">Sağ Taraf (Right)</option>
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Buton Metni (CTA Text)">
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                className="w-full px-3 py-2 bg-surface-primary border border-border-default rounded-md text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
                placeholder="Örn: Koleksiyonu Keşfet"
              />
            </FormField>

            <FormField label="Buton Linki (CTA URL)">
              <input
                type="text"
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                className="w-full px-3 py-2 bg-surface-primary border border-border-default rounded-md text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary font-mono text-xs"
                placeholder="/products"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border-subtle items-center">
            <FormField label="Sıra Numarası">
              <input
                type="number"
                min="0"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full px-3 py-2 bg-surface-primary border border-border-default rounded-md text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
              />
            </FormField>

            <div className="flex items-center justify-between pt-4">
              <span className="text-xs font-medium text-text-primary">Bölüm Aktif</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-action-primary" />
              </label>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-md transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-action-primary text-action-primary-text text-xs font-semibold rounded-md hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Kaydediliyor...' : 'Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

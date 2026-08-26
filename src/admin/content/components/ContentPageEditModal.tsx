import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { FormField } from '@/admin/ui';
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap';
import type { AdminContentPageItem, UpdateContentPageInput } from '../types';

interface ContentPageEditModalProps {
  page: AdminContentPageItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, input: UpdateContentPageInput) => Promise<void>;
}

export function ContentPageEditModal({
  page,
  isOpen,
  onClose,
  onSave,
}: ContentPageEditModalProps) {
  const { containerRef } = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });

  const [title, setTitle] = useState('');
  const [pageKey, setPageKey] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [published, setPublished] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (page) {
      setTitle(page.title || '');
      setPageKey(page.page_key || '');
      setSeoTitle(page.seo_title || '');
      setSeoDescription(page.seo_description || '');
      setPublished(page.published ?? true);
      setError(null);
    }
  }, [page]);

  if (!isOpen || !page) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Sayfa başlığı zorunludur.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave(page.id, {
        title: title.trim(),
        page_key: pageKey.trim(),
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
        published,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sayfa güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in text-left"
      role="dialog"
      aria-modal="true"
      aria-labelledby="content-page-modal-title"
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className="relative w-full max-w-xl bg-surface-primary rounded-xl shadow-elevated border border-border-default overflow-hidden flex flex-col max-h-[90vh] focus:outline-none"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-secondary/40">
          <div>
            <h2 id="content-page-modal-title" className="text-base font-semibold text-text-primary">
              Sayfa Bilgileri & SEO Düzenle
            </h2>
            <p className="text-xs text-text-muted mt-0.5 font-mono">
              Key: {page.page_key}
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

          <FormField label="Sayfa Başlığı" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-surface-primary border border-border-default rounded-md text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
              placeholder="Örn: Hakkımızda & Zanaat Hikayemiz"
            />
          </FormField>

          <FormField label="Sayfa Anahtarı (page_key)" required>
            <input
              type="text"
              value={pageKey}
              disabled
              className="w-full px-3 py-2 bg-surface-secondary border border-border-subtle rounded-md text-text-muted cursor-not-allowed font-mono text-xs"
            />
          </FormField>

          <div className="pt-2 border-t border-border-subtle space-y-4">
            <h3 className="text-xs uppercase font-semibold tracking-wider text-text-secondary">
              Arama Motoru Optimizasyonu (SEO)
            </h3>

            <FormField label="SEO Başlığı (Meta Title)">
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full px-3 py-2 bg-surface-primary border border-border-default rounded-md text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
                placeholder="Örn: Hakkımızda | Vazo Studio"
              />
            </FormField>

            <FormField label="SEO Açıklaması (Meta Description)">
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-surface-primary border border-border-default rounded-md text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary leading-relaxed"
                placeholder="Arama motorlarında listelenecek sayfa özeti..."
              />
            </FormField>
          </div>

          <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
            <span className="text-xs font-medium text-text-primary">Yayın Durumu</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-action-primary" />
            </label>
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

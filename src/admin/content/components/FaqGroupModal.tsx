import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { FormField } from '@/admin/ui';
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap';
import type { AdminFaqGroup, CreateFaqGroupInput, UpdateFaqGroupInput } from '../types';

interface FaqGroupModalProps {
  group: AdminFaqGroup | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: CreateFaqGroupInput | UpdateFaqGroupInput, groupId?: string) => Promise<void>;
}

export function FaqGroupModal({ group, isOpen, onClose, onSave }: FaqGroupModalProps) {
  const { containerRef } = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });

  const [title, setTitle] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (group) {
      setTitle(group.title || '');
      setSortOrder(group.sort_order ?? 1);
      setActive(group.active ?? true);
      setError(null);
    } else {
      setTitle('');
      setSortOrder(1);
      setActive(true);
      setError(null);
    }
  }, [group]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Kategori başlığı zorunludur.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      if (group) {
        await onSave({ title: title.trim(), sort_order: sortOrder, active }, group.id);
      } else {
        await onSave({ title: title.trim(), sort_order: sortOrder, active });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kategori kaydedilirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in text-left"
      role="dialog"
      aria-modal="true"
      aria-labelledby="faq-group-modal-title"
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className="relative w-full max-w-md bg-surface-primary rounded-xl shadow-elevated border border-border-default overflow-hidden flex flex-col focus:outline-none"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-secondary/40">
          <div>
            <h2 id="faq-group-modal-title" className="text-base font-semibold text-text-primary">
              {group ? 'FAQ Kategorisini Düzenle' : 'Yeni FAQ Kategorisi Ekle'}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Soruların gruplanacağı ana başlık.
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm font-sans">
          {error && (
            <div className="p-3 bg-feedback-error/10 border border-feedback-error/20 text-feedback-error rounded-md text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <FormField label="Kategori Başlığı" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-surface-primary border border-border-default rounded-md text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
              placeholder="Örn: Sipariş & Teslimat"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4 items-center pt-2">
            <FormField label="Sıra">
              <input
                type="number"
                min="0"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full px-3 py-2 bg-surface-primary border border-border-default rounded-md text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
              />
            </FormField>

            <div className="flex items-center justify-between pt-4">
              <span className="text-xs font-medium text-text-primary">Kategori Aktif</span>
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

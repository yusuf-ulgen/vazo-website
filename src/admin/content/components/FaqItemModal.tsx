import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { FormField } from '@/admin/ui';
import type { AdminFaqItem, CreateFaqItemInput, UpdateFaqItemInput } from '../types';

interface FaqItemModalProps {
  groupId: string;
  item: AdminFaqItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: CreateFaqItemInput | UpdateFaqItemInput, itemId?: string) => Promise<void>;
}

export function FaqItemModal({ groupId, item, isOpen, onClose, onSave }: FaqItemModalProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setQuestion(item.question || '');
      setAnswer(item.answer || '');
      setSortOrder(item.sort_order ?? 1);
      setActive(item.active ?? true);
      setError(null);
    } else {
      setQuestion('');
      setAnswer('');
      setSortOrder(1);
      setActive(true);
      setError(null);
    }
  }, [item]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      setError('Soru metni zorunludur.');
      return;
    }
    if (!answer.trim()) {
      setError('Cevap metni zorunludur.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      if (item) {
        await onSave(
          {
            question: question.trim(),
            answer: answer.trim(),
            sort_order: sortOrder,
            active,
          },
          item.id
        );
      } else {
        await onSave({
          group_id: groupId,
          question: question.trim(),
          answer: answer.trim(),
          sort_order: sortOrder,
          active,
        });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Soru kaydedilirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in text-left">
      <div className="relative w-full max-w-lg bg-surface-primary rounded-xl shadow-elevated border border-border-default overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-secondary/40">
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              {item ? 'Soru & Cevap Düzenle' : 'Yeni Soru & Cevap Ekle'}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Kullanıcılara gösterilecek soru ve detaylı yanıt.
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

          <FormField label="Soru Metni" required>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-3 py-2 bg-surface-primary border border-border-default rounded-md text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
              placeholder="Örn: Siparişler ne kadar sürede kargoya teslim edilir?"
            />
          </FormField>

          <FormField label="Cevap Metni" required>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-surface-primary border border-border-default rounded-md text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary leading-relaxed"
              placeholder="Kapsamlı ve aydınlatıcı cevap metni..."
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
              <span className="text-xs font-medium text-text-primary">Soru Aktif</span>
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

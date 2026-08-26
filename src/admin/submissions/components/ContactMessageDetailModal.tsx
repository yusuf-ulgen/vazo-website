import { useState, useEffect } from 'react';
import { X, Save, Mail, Calendar, User, Info, AlertCircle } from 'lucide-react';
import { FormField } from '@/admin/ui';
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap';
import type { AdminContactMessage, ContactMessageStatus, UpdateContactMessageInput } from '../types';

interface ContactMessageDetailModalProps {
  message: AdminContactMessage | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, input: UpdateContactMessageInput) => Promise<void>;
}

export function ContactMessageDetailModal({
  message,
  isOpen,
  onClose,
  onSave,
}: ContactMessageDetailModalProps) {
  const { containerRef } = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });

  const [status, setStatus] = useState<ContactMessageStatus>('new');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (message) {
      setStatus(message.status);
      setAdminNotes(message.admin_notes || '');
      setError(null);
    }
  }, [message]);

  if (!isOpen || !message) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await onSave(message.id, {
        status,
        admin_notes: adminNotes.trim() || null,
        reviewed_at: new Date().toISOString(),
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Mesaj güncellenirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const statusOptions: { value: ContactMessageStatus; label: string }[] = [
    { value: 'new', label: 'Yeni (İncelenmedi)' },
    { value: 'read', label: 'Okundu' },
    { value: 'replied', label: 'Dışarıdan Yanıtlandı' },
    { value: 'archived', label: 'Arşivlendi' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-fade-in text-left"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className="bg-surface-primary border border-border-default rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-elevated overflow-hidden animate-slide-up focus:outline-none"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-surface-primary shrink-0">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted">
              İletişim Mesajı Detayı
            </span>
            <h3 id="contact-modal-title" className="font-display text-lg text-text-primary font-normal truncate">
              {message.subject}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-feedback-error/10 border border-feedback-error/20 rounded-md text-feedback-error text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Sender Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-surface-secondary border border-border-subtle rounded-lg text-xs">
            <div className="flex items-center gap-2 text-text-secondary">
              <User className="w-4 h-4 text-text-muted shrink-0" />
              <span className="font-medium text-text-primary">{message.name}</span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <Mail className="w-4 h-4 text-text-muted shrink-0" />
              <a
                href={`mailto:${message.email}`}
                className="text-text-primary font-mono hover:underline truncate"
              >
                {message.email}
              </a>
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <Calendar className="w-4 h-4 text-text-muted shrink-0" />
              <span>{new Date(message.created_at).toLocaleString('tr-TR')}</span>
            </div>
            {message.reviewed_at && (
              <div className="text-text-muted">
                Son İnceleme: {new Date(message.reviewed_at).toLocaleDateString('tr-TR')}
              </div>
            )}
          </div>

          {/* Message Body */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Mesaj Metni
            </label>
            <div className="p-4 bg-surface-secondary/50 border border-border-subtle rounded-lg text-xs sm:text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
              {message.message}
            </div>
          </div>

          {/* Outbound Email Info Notice */}
          <div className="p-3.5 bg-feedback-info/10 border border-feedback-info/20 rounded-lg flex items-start gap-2.5 text-xs text-text-secondary">
            <Info className="w-4 h-4 text-feedback-info shrink-0 mt-0.5" />
            <p>
              <strong>E-posta Yanıt Bildirimi:</strong> Mesajı yanıtlamak için lütfen kendi e-posta istemcinizi ({message.email}) kullanınız. Yanıt gönderdikten sonra durumunu &quot;Dışarıdan Yanıtlandı&quot; olarak güncelleyebilirsiniz.
            </p>
          </div>

          {/* Status & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Mesaj Durumu" htmlFor="message-status">
              <select
                id="message-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ContactMessageStatus)}
                className="w-full px-3 py-2 bg-surface-primary border border-border-default rounded-md text-text-primary text-xs focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Yönetici Notu" htmlFor="admin-notes">
              <textarea
                id="admin-notes"
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Örn: Telefonla arandı, numune kargolandı..."
                className="w-full px-3 py-2 bg-surface-primary border border-border-default rounded-md text-text-primary text-xs focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
              />
            </FormField>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border-subtle flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              Kapat
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 bg-action-primary text-action-primary-text px-5 py-2 rounded-md text-xs font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

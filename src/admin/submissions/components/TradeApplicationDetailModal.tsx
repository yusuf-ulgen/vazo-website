import { useState, useEffect } from 'react';
import {
  X,
  Save,
  Building2,
  Phone,
  Mail,
  Globe,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { FormField } from '@/admin/ui';
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap';
import type { AdminTradeApplication, TradeApplicationStatus, UpdateTradeApplicationInput } from '../types';

interface TradeApplicationDetailModalProps {
  application: AdminTradeApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, input: UpdateTradeApplicationInput) => Promise<void>;
  onApprove?: (id: string, notes?: string) => Promise<void>;
  onRevoke?: (id: string, notes?: string) => Promise<void>;
}

export function TradeApplicationDetailModal({
  application,
  isOpen,
  onClose,
  onSave,
  onApprove,
  onRevoke,
}: TradeApplicationDetailModalProps) {
  const [status, setStatus] = useState<TradeApplicationStatus>('pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

  const { containerRef } = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });

  useEffect(() => {
    if (application) {
      setStatus(application.status);
      setAdminNotes(application.admin_notes || '');
      setError(null);
      setShowRevokeConfirm(false);
    }
  }, [application]);

  if (!isOpen || !application) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await onSave(application.id, {
        status,
        admin_notes: adminNotes.trim() || null,
        reviewed_at: new Date().toISOString(),
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Başvuru güncellenirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveAction = async () => {
    if (!onApprove) return;
    setActionLoading('approve');
    setError(null);
    try {
      await onApprove(application.id, adminNotes.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Onaylama işlemi başarısız oldu.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeAction = async () => {
    if (!onRevoke) return;
    setActionLoading('revoke');
    setError(null);
    try {
      await onRevoke(application.id, adminNotes.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Yetki iptal işlemi başarısız oldu.');
    } finally {
      setActionLoading(null);
      setShowRevokeConfirm(false);
    }
  };

  const statusOptions: { value: TradeApplicationStatus; label: string }[] = [
    { value: 'pending', label: 'Beklemede (Yeni Başvuru)' },
    { value: 'approved', label: 'Onaylandı (Toptan Sipariş & İskonto Açık)' },
    { value: 'more_info_needed', label: 'Ek Bilgi Gerekli' },
    { value: 'rejected', label: 'Reddedildi' },
  ];

  const customerMessageContent = application.customer_message || application.notes;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-fade-in text-left"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trade-modal-title"
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className="bg-surface-primary border border-border-default rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-elevated overflow-hidden animate-slide-up focus:outline-none"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-surface-primary shrink-0">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted">
              Kurumsal B2B Başvuru Detayı
            </span>
            <h3 id="trade-modal-title" className="font-display text-lg text-text-primary font-normal truncate">
              {application.company_name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-feedback-error/10 border border-feedback-error/20 rounded-md text-feedback-error text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Linked Customer Account Status Banner */}
          <div className="p-3.5 bg-surface-secondary border border-border-default rounded-lg flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              {application.user_id ? (
                <div className="w-8 h-8 rounded-full bg-feedback-success/15 text-feedback-success flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-surface-muted text-text-muted flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
              )}
              <div>
                <span className="font-semibold text-text-primary block">
                  {application.user_id ? 'Doğrulanmış Müşteri Hesabı Bağlı' : 'Bağlı Müşteri Hesabı Henüz Yok'}
                </span>
                <span className="text-text-muted text-[11px]">
                  {application.user_id
                    ? `Kullanıcı ID: ${application.user_id}`
                    : 'Müşteri kayıt olduğunda veya onaylandığında e-posta üzerinden otomatik bağlanacaktır.'}
                </span>
              </div>
            </div>

            {application.status === 'approved' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-feedback-success bg-feedback-success/10 px-2.5 py-1 rounded border border-feedback-success/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Toptan Yetkisi Aktif
              </span>
            )}
          </div>

          {/* Quick Authority Actions */}
          <div className="flex flex-wrap items-center gap-2.5 p-3.5 bg-canvas-warm/40 border border-border-subtle rounded-lg">
            <span className="text-[11px] uppercase font-semibold text-text-secondary mr-1">
              Hızlı Yetki İşlemleri:
            </span>

            {application.status !== 'approved' && onApprove && (
              <button
                type="button"
                disabled={Boolean(actionLoading)}
                onClick={handleApproveAction}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-feedback-success text-surface-primary text-xs font-semibold rounded hover:bg-feedback-success/90 transition-colors disabled:opacity-50 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{actionLoading === 'approve' ? 'Onaylanıyor...' : 'Başvuruyu Onayla & Toptan Yetkisi Ver'}</span>
              </button>
            )}

            {application.status === 'approved' && onRevoke && !showRevokeConfirm && (
              <button
                type="button"
                disabled={Boolean(actionLoading)}
                onClick={() => setShowRevokeConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-feedback-error text-surface-primary text-xs font-semibold rounded hover:bg-feedback-error/90 transition-colors disabled:opacity-50 shadow-xs"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Toptan Yetkisini İptal Et (Revoke)</span>
              </button>
            )}

            {showRevokeConfirm && (
              <div className="flex items-center gap-2 animate-fade-in">
                <span className="text-xs text-feedback-error font-medium">Yetkiyi iptal etmek istediğinize emin misiniz?</span>
                <button
                  type="button"
                  disabled={Boolean(actionLoading)}
                  onClick={handleRevokeAction}
                  className="px-2.5 py-1 bg-feedback-error text-surface-primary text-xs font-bold rounded hover:opacity-90"
                >
                  {actionLoading === 'revoke' ? 'İptal Ediliyor...' : 'Evet, İptal Et'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRevokeConfirm(false)}
                  className="px-2.5 py-1 bg-surface-secondary text-text-secondary text-xs rounded hover:text-text-primary"
                >
                  Vazgeç
                </button>
              </div>
            )}
          </div>

          {/* Company & Legal Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-surface-secondary border border-border-subtle rounded-lg text-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-text-secondary">
                <Building2 className="w-4 h-4 text-text-muted shrink-0" />
                <span className="font-medium text-text-primary">{application.company_name}</span>
              </div>
              <div className="text-text-muted pl-6">
                Faaliyet Alanı: <strong className="text-text-secondary">{application.business_type}</strong>
              </div>
              <div className="text-text-muted pl-6">
                Vergi No / Daire: <strong className="text-text-secondary">{application.tax_number} / {application.tax_office}</strong>
              </div>
              {application.website && (
                <div className="flex items-center gap-2 text-text-secondary pl-6">
                  <Globe className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <a
                    href={application.website.startsWith('http') ? application.website : `https://${application.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-action-primary hover:underline truncate"
                  >
                    {application.website}
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-2 border-t md:border-t-0 md:border-l border-border-subtle pt-3 md:pt-0 md:pl-4">
              <div className="text-text-muted">
                Yetkili: <strong className="text-text-primary">{application.contact_person}</strong>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Mail className="w-4 h-4 text-text-muted shrink-0" />
                <a href={`mailto:${application.email}`} className="text-text-primary hover:underline font-mono">
                  {application.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Phone className="w-4 h-4 text-text-muted shrink-0" />
                <a href={`tel:${application.phone}`} className="text-text-primary hover:underline font-mono">
                  {application.phone}
                </a>
              </div>
              <div className="text-text-muted">
                Tahmini Hacim: <strong className="text-text-secondary">{application.estimated_monthly_volume || 'Belirtilmedi'}</strong>
              </div>
            </div>
          </div>

          {/* Applicant Notes & Customer Message */}
          {customerMessageContent && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-text-muted" />
                <span>Başvuru Notu & Müşteri Mesajı</span>
              </label>
              <div className="p-4 bg-surface-secondary/50 border border-border-subtle rounded-lg text-xs sm:text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                {customerMessageContent}
              </div>
            </div>
          )}

          {/* Dates info */}
          <div className="flex items-center gap-4 text-xs text-text-muted px-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Başvuru: {new Date(application.submitted_at).toLocaleString('tr-TR')}</span>
            </div>
            {application.reviewed_at && (
              <div>
                Son İnceleme: {new Date(application.reviewed_at).toLocaleString('tr-TR')}
              </div>
            )}
          </div>

          {/* Status & Admin Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Başvuru Durumu" htmlFor="trade-status">
              <select
                id="trade-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TradeApplicationStatus)}
                className="w-full px-3 py-2 bg-surface-primary border border-border-default rounded-md text-text-primary text-xs focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Yönetici İnceleme Notu" htmlFor="trade-admin-notes">
              <textarea
                id="trade-admin-notes"
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Örn: Vergi levhası doğrulandı, %40 toptan iskonto tanımlandı..."
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
              disabled={isSaving || Boolean(actionLoading)}
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

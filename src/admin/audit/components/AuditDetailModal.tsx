import { X, ShieldCheck, User, Calendar, Tag, Activity } from 'lucide-react';
import { StatusBadge } from '@/admin/ui';
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap';
import type { AdminAuditLog, AuditAction } from '../types';

interface AuditDetailModalProps {
  log: AdminAuditLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AuditDetailModal({ log, isOpen, onClose }: AuditDetailModalProps) {
  const { containerRef } = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });

  if (!isOpen || !log) return null;

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case 'CREATE':
        return <StatusBadge status="active" label="Oluşturma" />;
      case 'UPDATE':
        return <StatusBadge status="info" label="Güncelleme" />;
      case 'DELETE':
        return <StatusBadge status="draft" label="Silme" />;
      case 'STATUS_CHANGE':
        return <StatusBadge status="warning" label="Durum Değişikliği" />;
      case 'BULK_UPDATE':
        return <StatusBadge status="info" label="Toplu Güncelleme" />;
      default:
        return <StatusBadge status="draft" label={action} />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-fade-in text-left"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-modal-title"
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className="bg-surface-primary border border-border-default rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-elevated overflow-hidden animate-slide-up focus:outline-none"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-surface-primary shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-feedback-success shrink-0" />
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted">
                Denetim İzi Kaydı
              </span>
              <h3 id="audit-modal-title" className="font-display text-lg text-text-primary font-normal">
                {log.entity_name || log.entity_id}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Metadata Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-surface-secondary border border-border-subtle rounded-lg">
            <div className="flex items-center gap-2 text-text-secondary">
              <Activity className="w-4 h-4 text-text-muted shrink-0" />
              <span>İşlem:</span>
              <div>{getActionBadge(log.action)}</div>
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <Tag className="w-4 h-4 text-text-muted shrink-0" />
              <span>Varlık:</span>
              <span className="font-mono text-text-primary font-medium">{log.entity_type}</span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <User className="w-4 h-4 text-text-muted shrink-0" />
              <span>Yapan:</span>
              <span className="font-mono text-text-primary">{log.actor_email || 'Bilinmeyen'}</span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <Calendar className="w-4 h-4 text-text-muted shrink-0" />
              <span>Tarih:</span>
              <span>{new Date(log.created_at).toLocaleString('tr-TR')}</span>
            </div>
          </div>

          {/* Safe Metadata JSON / Key-Value */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Güvenli Değişiklik Parametreleri (Metadata)
              </label>
              <span className="text-[11px] text-text-muted">PII Maskeli / Güvenli</span>
            </div>
            <div className="p-4 bg-surface-secondary/70 border border-border-subtle rounded-lg font-mono text-[11px] text-text-primary overflow-x-auto">
              <pre className="whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(log.safe_metadata, null, 2)}
              </pre>
            </div>
          </div>

          {/* Immutability Seal */}
          <div className="p-3.5 bg-feedback-success/10 border border-feedback-success/20 rounded-lg flex items-start gap-2.5 text-text-secondary">
            <ShieldCheck className="w-4 h-4 text-feedback-success shrink-0 mt-0.5" />
            <p>
              <strong>Değiştirilemezlik Güvencesi:</strong> Bu denetim kaydı PostgreSQL motor düzeyinde kilitlidir. UPDATE ve DELETE yetkileri yöneticiler dahil tüm roller için engellenmiştir.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-border-subtle bg-surface-secondary flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-surface-primary border border-border-default hover:bg-surface-muted rounded-md text-xs font-semibold text-text-primary transition-colors shadow-xs"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

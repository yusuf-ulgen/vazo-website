import { useState } from 'react';
import {
  RotateCcw,
  X,
  AlertTriangle,
  Info,
  Loader2,
} from 'lucide-react';
import { PaymentRecord, AdminRefundRequest } from '@/entities/order/types';
import { formatMoneyMinor } from '@/shared/lib/money';

interface AdminRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentRecord;
  orderNumber: string;
  onSuccess: () => void;
  onProcessRefund: (req: AdminRefundRequest) => Promise<unknown>;
}

export function AdminRefundModal({
  isOpen,
  onClose,
  payment,
  orderNumber,
  onSuccess,
  onProcessRefund,
}: AdminRefundModalProps) {
  const remainingMinor = Math.max(0, payment.expected_amount_minor - payment.refunded_amount_minor);
  const maxRefundMajor = (remainingMinor / 100).toFixed(2);

  const [refundAmountMajor, setRefundAmountMajor] = useState<string>(maxRefundMajor);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFullRefund = () => {
    setRefundAmountMajor(maxRefundMajor);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedMajor = parseFloat(refundAmountMajor);
    if (isNaN(parsedMajor) || parsedMajor <= 0) {
      setError('Lütfen sıfırdan büyük geçerli bir iade tutarı girin.');
      return;
    }

    const requestedMinor = Math.round(parsedMajor * 100);
    if (requestedMinor > remainingMinor) {
      setError(`İade tutarı kalan iade edilebilir bakiyeyi (${formatMoneyMinor(remainingMinor, payment.currency)}) aşamaz.`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onProcessRefund({
        payment_id: payment.id,
        refund_amount_minor: requestedMinor,
        reason: reason.trim() || undefined,
        idempotency_key: `ref_${payment.id}_${requestedMinor}_${Date.now()}`,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'İade işlemi başlatılamadı.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="refund-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-surface-primary border border-border-default rounded-xl w-full max-w-lg shadow-xl overflow-hidden text-left">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border-default flex items-center justify-between bg-surface-secondary/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-feedback-warning/10 text-feedback-warning rounded-lg">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 id="refund-modal-title" className="text-sm font-semibold text-text-primary">
                PayTR Para İadesi (Refund)
              </h2>
              <p className="text-[11px] text-text-muted">
                Sipariş: {orderNumber} &bull; OID: {payment.merchant_oid}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-text-muted hover:text-text-primary rounded-md hover:bg-surface-muted transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-surface-secondary rounded-lg text-xs">
            <div>
              <span className="text-[10px] font-mono text-text-muted uppercase">Toplam Tahsilat</span>
              <div className="font-semibold font-mono text-text-primary mt-0.5">
                {formatMoneyMinor(payment.expected_amount_minor, payment.currency)}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono text-text-muted uppercase">Kalan İade Edilebilir</span>
              <div className="font-semibold font-mono text-feedback-success mt-0.5">
                {formatMoneyMinor(remainingMinor, payment.currency)}
              </div>
            </div>
          </div>

          {/* Refund Amount Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="refund-amount" className="font-medium text-text-primary">
                İade Edilecek Tutar ({payment.currency})
              </label>
              <button
                type="button"
                onClick={handleFullRefund}
                className="text-accent-primary hover:underline font-semibold text-[11px]"
              >
                Tam İade ({maxRefundMajor} TL)
              </button>
            </div>
            <div className="relative">
              <input
                id="refund-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={maxRefundMajor}
                value={refundAmountMajor}
                onChange={(e) => setRefundAmountMajor(e.target.value)}
                disabled={isSubmitting || remainingMinor === 0}
                className="w-full px-3 py-2 text-sm font-mono font-semibold bg-surface-secondary border border-border-default rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted font-mono">
                {payment.currency}
              </span>
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label htmlFor="refund-reason" className="text-xs font-medium text-text-primary">
              İade Nedeni (Müşteri Bildirimi / Denetim Kaydı)
            </label>
            <textarea
              id="refund-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Örn: Müşteri talebi, kırık ürün teslimi veya vazgeçme..."
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-xs bg-surface-secondary border border-border-default rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </div>

          {/* Critical Stock Decoupling Notice */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 rounded-lg text-[11px] leading-relaxed flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong>Envanter Ayrımı Uyarısı:</strong> Finansal para iadesi, fiziksel ürünün depoya
              döndüğünü garanti etmez. İade işlemi sonrasında ürün stoğu otomatik olarak artırılmaz;
              ürün atölyeye fiziki olarak ulaştığında <em>Stok Yönetimi</em> ekranından manuel
              sayım artırımı yapılmalıdır.
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3 bg-feedback-error/10 border border-feedback-error/20 text-feedback-error rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-semibold bg-surface-secondary hover:bg-surface-muted text-text-secondary rounded-md border border-border-default transition-colors disabled:opacity-50"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmitting || remainingMinor === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-feedback-warning hover:bg-feedback-warning/90 text-surface-primary rounded-md transition-colors shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>PayTR İadesi Yapılıyor...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>İadeyi Onayla & PayTR'a Gönder</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

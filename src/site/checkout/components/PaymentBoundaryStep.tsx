import { CreateOrderResponse } from '@/entities/order/types';
import { formatMoneyMinor } from '@/shared/lib/money';
import { CreditCard, CheckCircle, Clock } from 'lucide-react';

interface PaymentBoundaryStepProps {
  orderResponse: CreateOrderResponse;
}

export function PaymentBoundaryStep({ orderResponse }: PaymentBoundaryStepProps) {
  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-border-subtle pb-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-feedback-success shrink-0" />
          <h2 className="font-display text-2xl text-text-primary">Sipariş Kaydı Oluşturuldu</h2>
        </div>
        <p className="text-xs text-text-secondary mt-1">
          Sipariş numaranız: <strong className="text-text-primary">{orderResponse.order_number}</strong>
        </p>
      </div>

      {/* Order Status & Reservation Timer Card */}
      <div className="p-5 bg-surface-primary border border-border-default rounded-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">Ödenecek Tutar</span>
          <span className="font-display text-2xl font-bold text-text-primary">
            {formatMoneyMinor(orderResponse.total_minor, orderResponse.currency)}
          </span>
        </div>

        <div className="p-3 bg-surface-muted rounded-xs flex items-center gap-3 text-xs text-text-secondary">
          <Clock className="w-4 h-4 text-accent-primary shrink-0" />
          <span>
            Stok rezervasyonunuz <strong>{orderResponse.reservation_timeout_minutes} dakika</strong> boyunca
            koruma altındadır.
          </span>
        </div>
      </div>

      {/* Payment Frame Boundary Placeholder */}
      <div className="p-8 border-2 border-dashed border-border-default rounded-sm bg-surface-secondary/50 text-center space-y-3">
        <CreditCard className="w-10 h-10 text-text-muted mx-auto" />
        <h3 className="text-sm font-semibold text-text-primary">
          Güvenli Ödeme Altyapısı (PayTR Entegrasyonu)
        </h3>
        <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
          Bu adımda sunucu tarafından sağlanan PayTR 3D Secure güvenli iFrame penceresi açılacaktır (Phase 3.5).
          Kart bilgileri kesinlikle sitemizde saklanmaz ve PayTR sunucularında doğrudan işlenir.
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-muted text-text-muted text-[11px] font-mono rounded-xs">
          <span>Durum: pending_payment</span>
          <span>•</span>
          <span>PayTR Frame Boundary Hazır</span>
        </div>
      </div>
    </div>
  );
}

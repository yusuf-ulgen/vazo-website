import { useState, useEffect, useCallback } from 'react';
import { CreateOrderResponse, PayTRTokenResponse } from '@/entities/order/types';
import { orderRepository } from '@/entities/order/api/order-repository';
import { formatMoneyMinor } from '@/shared/lib/money';
import { PayTRPaymentFrame } from './PayTRPaymentFrame';
import { CheckCircle, Clock, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

interface PaymentBoundaryStepProps {
  orderResponse: CreateOrderResponse;
}

export function PaymentBoundaryStep({ orderResponse }: PaymentBoundaryStepProps) {
  const [tokenResponse, setTokenResponse] = useState<PayTRTokenResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await orderRepository.getPayTRToken(orderResponse.order_id);
      setTokenResponse(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ödeme oturumu başlatılamadı.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [orderResponse.order_id]);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

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

      {/* PayTR Payment Frame or Loading/Error State */}
      {isLoading ? (
        <div className="p-12 border border-border-default rounded-sm bg-surface-primary text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-text-primary mx-auto" />
          <h3 className="text-sm font-semibold text-text-primary">
            Güvenli Ödeme Oturumu Hazırlanıyor...
          </h3>
          <p className="text-xs text-text-muted">
            PayTR 3D Secure oturumu şifreleniyor. Lütfen bekleyin.
          </p>
        </div>
      ) : error ? (
        <div className="p-6 border border-feedback-danger/30 bg-feedback-danger-surface rounded-sm space-y-3">
          <div className="flex items-center gap-2 text-feedback-danger text-sm font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Ödeme Başlatılamadı</span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">{error}</p>
          <button
            type="button"
            onClick={fetchToken}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-text-primary text-canvas-default text-xs font-semibold rounded-xs hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Yeniden Dene</span>
          </button>
        </div>
      ) : tokenResponse ? (
        <PayTRPaymentFrame
          iframeUrl={tokenResponse.iframe_url}
          isTestMode={tokenResponse.is_test_mode}
        />
      ) : null}
    </div>
  );
}

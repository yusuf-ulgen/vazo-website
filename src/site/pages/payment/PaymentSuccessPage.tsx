import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Clock, AlertTriangle, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Container } from '@/shared/ui/Container';
import { Section } from '@/shared/ui/Section';
import { orderRepository } from '@/entities/order/api/order-repository';
import { Order } from '@/entities/order/types';
import { formatMoneyMinor } from '@/shared/lib/money';
import { useSEO } from '@/shared/lib/seo';

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id') || searchParams.get('merchant_oid') || '';

  const [order, setOrder] = useState<Order | null>(null);
  const [pollCount, setPollCount] = useState<number>(0);
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useSEO({
    title: 'Ödeme Doğrulaması | Vazo Studio',
    description: 'Sipariş ödeme durumunuz doğrulanıyor.',
  });

  useEffect(() => {
    if (!orderId) {
      setIsVerifying(false);
      return;
    }

    let isMounted = true;
    let timer: NodeJS.Timeout;

    const checkOrderStatus = async () => {
      try {
        const fetchedOrder = await orderRepository.getOrderById(orderId);
        if (!isMounted) return;

        if (fetchedOrder) {
          setOrder(fetchedOrder);
          // If status is terminal (paid, payment_review, payment_failed), stop polling
          if (fetchedOrder.status !== 'pending_payment') {
            setIsVerifying(false);
            return;
          }
        }

        // Bounded polling: up to 5 attempts (every 2s)
        if (pollCount < 5) {
          timer = setTimeout(() => {
            if (isMounted) {
              setPollCount((prev) => prev + 1);
            }
          }, 2000);
        } else {
          setIsVerifying(false);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error('[PaymentSuccessPage] Polling error:', err);
        setError(err instanceof Error ? err.message : 'Sipariş durumu sorgulanamadı.');
        setIsVerifying(false);
      }
    };

    checkOrderStatus();

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [orderId, pollCount]);

  return (
    <Section className="py-16 md:py-24 bg-canvas-default min-h-[60vh]">
      <Container size="sm">
        <div className="bg-surface-primary border border-border-default rounded-sm p-6 sm:p-10 text-center space-y-6 shadow-sm">
          {/* 1. Verifying State */}
          {isVerifying ? (
            <div className="space-y-4 py-8">
              <Loader2 className="w-12 h-12 animate-spin text-accent-primary mx-auto" />
              <h1 className="font-display text-2xl sm:text-3xl font-light text-text-primary">
                Ödeme Sonucunuz Doğrulanıyor...
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
                Bankanızdan ve PayTR altyapısından güvenli ödeme onayı bekleniyor. Lütfen bekleyiniz, sayfa otomatik güncellenecektir.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-muted rounded-xs text-[11px] text-text-muted font-mono">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                <span>Doğrulama denemesi: {pollCount + 1} / 10</span>
              </div>
            </div>
          ) : order?.status === 'paid' ? (
            /* 2. Confirmed Paid State */
            <div className="space-y-6">
              <div className="w-16 h-16 bg-feedback-success-surface border border-feedback-success/30 rounded-full flex items-center justify-center mx-auto text-feedback-success">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div>
                <h1 className="font-display text-3xl font-light text-text-primary">
                  Ödemeniz Başarıyla Alındı!
                </h1>
                <p className="text-xs sm:text-sm text-text-secondary mt-1.5">
                  Siparişiniz onaylandı ve hazırlık sürecine alındı.
                </p>
              </div>

              <div className="p-4 bg-surface-secondary border border-border-subtle rounded-xs space-y-2 text-left text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted">Sipariş No:</span>
                  <strong className="font-mono text-text-primary">{order.order_number}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Toplam Tutar:</span>
                  <strong className="text-text-primary">
                    {formatMoneyMinor(order.total_minor, order.currency)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Ödeme Durumu:</span>
                  <span className="text-feedback-success font-medium">Ödeme Onaylandı</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link
                  to={`/account/orders/${order.id}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-text-primary text-canvas-default text-xs font-semibold rounded-xs hover:opacity-90 transition-opacity"
                >
                  <span>Sipariş Detayına Git</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center px-6 py-3 bg-surface-muted text-text-primary text-xs font-medium rounded-xs hover:bg-surface-secondary transition-colors"
                >
                  Alışverişe Devam Et
                </Link>
              </div>
            </div>
          ) : order?.status === 'payment_review' ? (
            /* 3. Manual Review State */
            <div className="space-y-6">
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-500">
                <AlertTriangle className="w-10 h-10" />
              </div>

              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-light text-text-primary">
                  Ödeme İnceleme Aşamasında
                </h1>
                <p className="text-xs sm:text-sm text-text-secondary mt-1.5 leading-relaxed max-w-md mx-auto">
                  Ödeme işleminiz kaydedildi ancak tutar veya onay kriterleri müşteri temsilcimiz tarafından incelenmektedir.
                </p>
              </div>

              <div className="flex justify-center pt-2">
                <Link
                  to={`/account/orders/${order.id}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-text-primary text-canvas-default text-xs font-semibold rounded-xs"
                >
                  Siparişi Görüntüle
                </Link>
              </div>
            </div>
          ) : order?.status === 'payment_failed' ? (
            /* 4. Payment Failed State */
            <div className="space-y-6">
              <div className="w-16 h-16 bg-feedback-danger-surface border border-feedback-danger/30 rounded-full flex items-center justify-center mx-auto text-feedback-danger">
                <AlertCircle className="w-10 h-10" />
              </div>

              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-light text-text-primary">
                  Ödeme Onaylanamadı
                </h1>
                <p className="text-xs sm:text-sm text-text-secondary mt-1.5 max-w-md mx-auto">
                  Bankanız veya ödeme sağlayıcısı işlemi onaylamadı. Lütfen bilgilerinizi kontrol edip tekrar deneyiniz.
                </p>
              </div>

              <div className="flex justify-center pt-2">
                <Link
                  to="/checkout"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-text-primary text-canvas-default text-xs font-semibold rounded-xs"
                >
                  Ödemeyi Tekrar Dene
                </Link>
              </div>
            </div>
          ) : (
            /* 5. Polling Timeout / Pending Notification State */
            <div className="space-y-6">
              <div className="w-16 h-16 bg-surface-muted rounded-full flex items-center justify-center mx-auto text-text-muted">
                <Clock className="w-10 h-10" />
              </div>

              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-light text-text-primary">
                  Ödeme Bildirimi İşleniyor
                </h1>
                <p className="text-xs sm:text-sm text-text-secondary mt-1.5 max-w-md mx-auto leading-relaxed">
                  Ödeme sağlayıcısından yanıt bekleniyor. Siparişinizin güncel durumunu dilediğiniz an <strong>Hesabım &gt; Siparişlerim</strong> alanından kontrol edebilirsiniz.
                </p>
              </div>

              <div className="flex justify-center pt-2">
                <Link
                  to="/account/orders"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-text-primary text-canvas-default text-xs font-semibold rounded-xs"
                >
                  Siparişlerime Git
                </Link>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-feedback-danger pt-2">{error}</p>
          )}
        </div>
      </Container>
    </Section>
  );
}

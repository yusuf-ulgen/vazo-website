import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container } from '@/shared/ui/Container';
import { Section } from '@/shared/ui/Section';
import { useCustomerAuth } from '@/shared/stores/customer-auth-store';
import { orderRepository } from '@/entities/order/api/order-repository';
import { PaymentResumeEligibility, CreateOrderResponse } from '@/entities/order/types';
import { PaymentBoundaryStep } from '@/site/checkout/components/PaymentBoundaryStep';
import { formatMoneyMinor } from '@/shared/lib/money';
import { useSEO } from '@/shared/lib/seo';
import {
  Lock,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { AuthModal } from '@/site/components/AuthModal';

export function PaymentResumePage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user, isLoading: isAuthLoading } = useCustomerAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [eligibility, setEligibility] = useState<PaymentResumeEligibility | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useSEO({
    title: 'Ödemeyi Tamamla | Vazo Studio',
    description: 'Bekleyen siparişiniz için güvenli ödeme tamamlama adımı.',
  });

  const checkEligibility = useCallback(async () => {
    if (!orderId) {
      setError('Geçersiz sipariş adresi.');
      setIsLoading(false);
      return;
    }

    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await orderRepository.getPaymentResumeEligibility(orderId);
      setEligibility(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ödeme durumu doğrulanamadı.');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, user]);

  useEffect(() => {
    if (!isAuthLoading) {
      checkEligibility();
    }
  }, [isAuthLoading, checkEligibility]);

  // 1. Auth Loading State
  if (isAuthLoading) {
    return (
      <Section className="py-16 bg-canvas-default min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-text-muted" />
      </Section>
    );
  }

  // 2. Unauthenticated State
  if (!user) {
    return (
      <Section className="py-16 md:py-24 bg-canvas-default min-h-[60vh]">
        <Container size="sm">
          <div className="bg-surface-primary border border-border-default rounded-sm p-8 text-center space-y-6 shadow-sm">
            <div className="w-12 h-12 bg-surface-muted rounded-full flex items-center justify-center mx-auto text-text-primary">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display text-2xl text-text-primary">Giriş Yapılması Gerekiyor</h1>
              <p className="text-xs text-text-secondary mt-1.5 leading-relaxed max-w-sm mx-auto">
                Bekleyen siparişinize ait ödemeyi tamamlamak için lütfen hesabınıza giriş yapın.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="w-full sm:w-auto px-6 py-2.5 bg-action-primary text-action-primary-text text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors shadow-xs rounded-xs"
              >
                Giriş Yap
              </button>
              <Link
                to="/account/orders"
                className="w-full sm:w-auto px-6 py-2.5 bg-surface-muted text-text-primary text-xs font-semibold rounded-xs hover:bg-surface-secondary transition-colors"
              >
                Siparişlerime Dön
              </Link>
            </div>
          </div>
        </Container>
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </Section>
    );
  }

  // 3. Server Verification Loading
  if (isLoading) {
    return (
      <Section className="py-16 md:py-24 bg-canvas-default min-h-[60vh]">
        <Container size="sm">
          <div className="bg-surface-primary border border-border-default rounded-sm p-10 text-center space-y-4 shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-accent-primary mx-auto" />
            <h2 className="font-display text-2xl text-text-primary">Ödeme Uygunluğu Doğrulanıyor...</h2>
            <p className="text-xs text-text-secondary">
              Siparişinizin güncel durumu ve stok rezervasyonu kontrol ediliyor.
            </p>
          </div>
        </Container>
      </Section>
    );
  }

  // 4. Ineligible: Reservation Expired
  if (eligibility?.is_expired) {
    return (
      <Section className="py-16 md:py-24 bg-canvas-default min-h-[60vh]">
        <Container size="sm">
          <div className="bg-surface-primary border border-border-default rounded-sm p-8 text-center space-y-6 shadow-sm">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-500">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl text-text-primary">
                Stok Rezervasyon Süresi Doldu
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-2 max-w-md mx-auto leading-relaxed">
                Bu sipariş için ayrılan 15 dakikalık stok rezervasyon süresi sona ermiştir. Güncel stok ve fiyat doğruluğu için lütfen sepetinize dönerek yeni bir sipariş oluşturun.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/cart"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-action-primary text-action-primary-text text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors shadow-xs rounded-xs"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Sepete Dön ve Tekrar Dene</span>
              </Link>
              <Link
                to="/account/orders"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface-muted text-text-primary text-xs font-semibold rounded-xs hover:bg-surface-secondary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Siparişlerime Git</span>
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  // 5. Ineligible: Already Paid
  if (eligibility?.status === 'paid' || eligibility?.code === 'ALREADY_PAID') {
    return (
      <Section className="py-16 md:py-24 bg-canvas-default min-h-[60vh]">
        <Container size="sm">
          <div className="bg-surface-primary border border-border-default rounded-sm p-8 text-center space-y-6 shadow-sm">
            <div className="w-16 h-16 bg-feedback-success-surface border border-feedback-success/30 rounded-full flex items-center justify-center mx-auto text-feedback-success">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl text-text-primary">
                Bu Sipariş Zaten Ödenmiştir
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-2 max-w-md mx-auto">
                Siparişinizin ödemesi başarıyla onaylanmış ve hazırlık aşamasına alınmıştır.
              </p>
            </div>
            <div className="pt-2 flex justify-center">
              <Link
                to={`/account/orders/${orderId}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-text-primary text-canvas-default text-xs font-semibold rounded-xs hover:opacity-90"
              >
                <span>Sipariş Detayına Git</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  // 6. Ineligible: Cancelled, Forbidden or Other Error
  if (!eligibility?.eligible || error) {
    return (
      <Section className="py-16 md:py-24 bg-canvas-default min-h-[60vh]">
        <Container size="sm">
          <div className="bg-surface-primary border border-border-default rounded-sm p-8 text-center space-y-6 shadow-sm">
            <div className="w-16 h-16 bg-feedback-danger-surface border border-feedback-danger/30 rounded-full flex items-center justify-center mx-auto text-feedback-danger">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl text-text-primary">
                Ödeme Devam Ettirilemedi
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-2 max-w-md mx-auto leading-relaxed">
                {eligibility?.reason || error || 'Sipariş ödeme aşaması için uygun değil veya erişim yetkiniz bulunmamaktadır.'}
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={checkEligibility}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface-muted text-text-primary text-xs font-semibold rounded-xs hover:bg-surface-secondary transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tekrar Kontrol Et</span>
              </button>
              <Link
                to="/account/orders"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-text-primary text-canvas-default text-xs font-semibold rounded-xs hover:opacity-90"
              >
                <span>Siparişlerime Git</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  // 7. Eligible: Render Payment Frame using existing PaymentBoundaryStep
  const orderResponsePayload: CreateOrderResponse = {
    order_id: eligibility.order_id || orderId!,
    order_number: eligibility.order_number || '',
    status: 'pending_payment',
    subtotal_minor: eligibility.subtotal_minor || eligibility.total_minor || 0,
    shipping_minor: eligibility.shipping_minor || 0,
    total_minor: eligibility.total_minor || 0,
    currency: eligibility.currency || 'TRY',
    expires_at: eligibility.expires_at || '',
    payment_timeout_minutes: 15,
    reservation_timeout_minutes: 15,
  };

  return (
    <Section className="py-10 sm:py-16 bg-canvas-default min-h-[70vh]">
      <Container size="md">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="font-display text-3xl sm:text-4xl text-text-primary">
              Ödemeyi Tamamla
            </h1>
            <p className="text-xs text-text-secondary mt-1">
              Sipariş: <strong className="text-text-primary font-mono">{eligibility.order_number}</strong> • Tutar:{' '}
              <strong className="text-text-primary font-bold">
                {formatMoneyMinor(eligibility.total_minor || 0, eligibility.currency || 'TRY')}
              </strong>
            </p>
          </div>

          <div className="bg-surface-primary border border-border-default rounded-sm p-6 sm:p-8 shadow-xs">
            <PaymentBoundaryStep orderResponse={orderResponsePayload} />
          </div>

          <div className="text-center">
            <Link
              to={`/account/orders/${orderId}`}
              className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Sipariş detaylarına dön</span>
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '@/shared/ui/Container';
import { useCustomerAuth, customerAuthStore } from '@/shared/stores/customer-auth-store';
import { useCart } from '@/shared/stores/cart-store';
import { orderRepository } from '@/entities/order/api/order-repository';
import { CustomerAddress } from '@/entities/customer/types';
import { CheckoutQuoteResponse, CreateOrderResponse } from '@/entities/order/types';
import { CheckoutStepper, StepItem } from '@/site/checkout/components/CheckoutStepper';
import { AddressSelectionStep } from '@/site/checkout/components/AddressSelectionStep';
import { OrderSummaryStep } from '@/site/checkout/components/OrderSummaryStep';
import { LegalConsentStep } from '@/site/checkout/components/LegalConsentStep';
import { PaymentBoundaryStep } from '@/site/checkout/components/PaymentBoundaryStep';
import {
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Lock,
  LogIn,
  AlertCircle,
  Loader2,
  Truck,
} from 'lucide-react';
import { useSEO } from '@/shared/lib/seo';

const CHECKOUT_STEPS: StepItem[] = [
  { id: 1, label: 'Teslimat Adresi' },
  { id: 2, label: 'Fatura Adresi' },
  { id: 3, label: 'Kargo Seçimi' },
  { id: 4, label: 'Özet & Onay' },
  { id: 5, label: 'Ödeme' },
];

export function CheckoutPage() {
  const { user, addresses, isLoading: isAuthLoading } = useCustomerAuth();
  const { items: cartItems, clear: clearCart } = useCart();

  const [currentStep, setCurrentStep] = useState(1);
  const [shippingAddress, setShippingAddress] = useState<CustomerAddress | null>(null);
  const [billingAddress, setBillingAddress] = useState<CustomerAddress | null>(null);
  const [useSameAddress, setUseSameAddress] = useState(true);

  const [quote, setQuote] = useState<CheckoutQuoteResponse | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [acceptedPreliminaryInfo, setAcceptedPreliminaryInfo] = useState(false);
  const [acceptedDistanceSales, setAcceptedDistanceSales] = useState(false);

  const [createdOrder, setCreatedOrder] = useState<CreateOrderResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useSEO({
    title: 'Güvenli Ödeme & Sipariş | Vazo Studio',
    description: 'Vazo Studio sipariş ve güvenli ödeme adımı.',
  });

  // Automatically select default address on load
  useEffect(() => {
    if (addresses.length > 0 && !shippingAddress) {
      const defaultShip = addresses.find((a) => a.is_default_shipping) || addresses[0] || null;
      setShippingAddress(defaultShip);
      const defaultBill = addresses.find((a) => a.is_default_billing) || defaultShip || null;
      setBillingAddress(defaultBill);
    }
  }, [addresses, shippingAddress]);

  const cartSignature = useMemo(
    () => cartItems.map((ci) => `${ci.variantId}:${ci.quantity}`).join(','),
    [cartItems]
  );
  const destinationCountry = shippingAddress?.country_code;

  // Request authoritative quote when shipping address or cart items change
  useEffect(() => {
    if (!destinationCountry || cartItems.length === 0) {
      setQuote(null);
      return;
    }

    let isMounted = true;
    setIsQuoteLoading(true);
    setQuoteError(null);

    const quotePayload = {
      items: cartItems.map((ci) => ({
        variant_id: ci.variantId,
        quantity: ci.quantity,
      })),
      destination_country: destinationCountry,
      channel: 'retail' as const,
    };

    orderRepository
      .getQuote(quotePayload)
      .then((res) => {
        if (isMounted) {
          setQuote(res);
          setIsQuoteLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setQuoteError(err instanceof Error ? err.message : 'Kargo ve fiyat hesaplanamadı.');
          setIsQuoteLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [destinationCountry, cartSignature]);

  // If Auth Loading
  if (isAuthLoading) {
    return (
      <div className="w-full bg-canvas-default min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
      </div>
    );
  }

  // Auth Gate: Require authenticated customer
  if (!user) {
    return (
      <div className="w-full bg-canvas-default min-h-screen py-16">
        <Container size="sm">
          <div className="text-center p-8 bg-surface-primary border border-border-default rounded-sm shadow-sm space-y-6">
            <div className="w-12 h-12 bg-surface-muted rounded-full flex items-center justify-center mx-auto text-text-primary">
              <Lock className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h1 className="font-display text-2xl text-text-primary">Ödeme İçin Giriş Yapın</h1>
              <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
                Siparişinizi güvenle oluşturabilmemiz ve teslimatınızı takip edebilmeniz için lütfen
                hesabınıza giriş yapın. Sepetiniz korunacaktır.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => customerAuthStore.signInWithGoogle('/checkout')}
                className="w-full py-3 px-4 bg-text-primary text-canvas-default text-xs font-semibold rounded-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Google ile Giriş Yap & Devam Et
              </button>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // Empty Cart Gate
  if (cartItems.length === 0 && !createdOrder) {
    return (
      <div className="w-full bg-canvas-default min-h-screen py-16">
        <Container size="sm">
          <div className="text-center p-8 bg-surface-primary border border-border-default rounded-sm space-y-4">
            <ShoppingBag className="w-10 h-10 text-text-muted mx-auto" />
            <h2 className="font-display text-xl text-text-primary">Sepetiniz Boş</h2>
            <p className="text-xs text-text-secondary">
              Ödeme işlemine devam edebilmek için sepetinize en az bir ürün eklemelisiniz.
            </p>
            <Link
              to="/products"
              className="inline-block px-5 py-2.5 bg-text-primary text-canvas-default text-xs font-semibold hover:opacity-90 mt-2"
            >
              Koleksiyonu İncele
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  // Handle Atomic Order Creation
  const handleCreateOrder = async () => {
    if (!shippingAddress) {
      setSubmitError('Lütfen bir teslimat adresi seçin.');
      return;
    }
    if (!acceptedPreliminaryInfo || !acceptedDistanceSales) {
      setSubmitError('Lütfen yasal ön bilgilendirme ve mesafeli satış sözleşmesini onaylayın.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await orderRepository.createOrder({
        items: cartItems.map((ci) => ({
          variant_id: ci.variantId,
          quantity: ci.quantity,
        })),
        channel: 'retail',
        currency: 'TRY',
        destination_country: shippingAddress.country_code,
        shipping_address: shippingAddress,
        billing_address: useSameAddress ? shippingAddress : billingAddress || shippingAddress,
        accepted_preliminary_info: acceptedPreliminaryInfo,
        accepted_distance_sales: acceptedDistanceSales,
      });

      // Clear cart on successful order creation
      clearCart();
      setCreatedOrder(response);
      setCurrentStep(5);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Sipariş oluşturulamadı.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-canvas-default min-h-screen py-10 sm:py-16">
      <Container size="lg">
        {/* Top Header */}
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl sm:text-4xl text-text-primary">Güvenli Ödeme</h1>
          <p className="text-xs text-text-secondary mt-1">
            Giriş Yapılan Hesap: <strong className="text-text-primary">{user.email}</strong>
          </p>
        </div>

        {/* Stepper Navigation */}
        <CheckoutStepper
          currentStep={currentStep}
          steps={CHECKOUT_STEPS}
          onStepClick={(s) => s < currentStep && setCurrentStep(s)}
        />

        {/* Error Banners */}
        {(quoteError || submitError) && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-feedback-error/10 border border-feedback-error/20 rounded-xs flex items-center gap-3 text-xs text-feedback-error text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{quoteError || submitError}</span>
          </div>
        )}

        <div className="max-w-2xl mx-auto bg-surface-primary border border-border-default rounded-sm p-6 sm:p-8 shadow-xs">
          {/* STEP 1: Delivery Address */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <AddressSelectionStep
                title="1. Teslimat Adresi"
                description="Siparişinizin teslim edileceği adresi seçin."
                addresses={addresses}
                selectedAddressId={shippingAddress?.id || null}
                onSelectAddress={(addr) => setShippingAddress(addr)}
              />

              <div className="pt-6 border-t border-border-subtle flex justify-end">
                <button
                  type="button"
                  disabled={!shippingAddress}
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-text-primary text-canvas-default text-xs font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Fatura Adımına Geç
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Billing Address */}
          {currentStep === 2 && (
            <div className="space-y-6 text-left">
              <div className="border-b border-border-subtle pb-4">
                <h2 className="font-display text-2xl text-text-primary">2. Fatura Adresi</h2>
                <p className="text-xs text-text-secondary mt-1">
                  Faturanızın düzenleneceği adresi belirleyin.
                </p>
              </div>

              <label className="flex items-center gap-3 p-4 border border-border-default rounded-xs bg-surface-secondary/40 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useSameAddress}
                  onChange={(e) => setUseSameAddress(e.target.checked)}
                  className="w-4 h-4 rounded-xs border-border-default text-text-primary"
                />
                <span className="text-xs font-medium text-text-primary">
                  Fatura adresim teslimat adresim ile aynı olsun
                </span>
              </label>

              {!useSameAddress && (
                <AddressSelectionStep
                  title="Fatura Adresi Seçin"
                  description="Faturanız için ayrı bir adres belirleyin."
                  addresses={addresses}
                  selectedAddressId={billingAddress?.id || null}
                  onSelectAddress={(addr) => setBillingAddress(addr)}
                />
              )}

              <div className="pt-6 border-t border-border-subtle flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Teslimat Adresine Dön
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-text-primary text-canvas-default text-xs font-semibold hover:opacity-90"
                >
                  Kargo Seçimine Geç
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Shipping */}
          {currentStep === 3 && (
            <div className="space-y-6 text-left">
              <div className="border-b border-border-subtle pb-4">
                <h2 className="font-display text-2xl text-text-primary">3. Kargo & Teslimat</h2>
                <p className="text-xs text-text-secondary mt-1">
                  Teslimat ülkesi: <strong>{shippingAddress?.country_name} ({shippingAddress?.country_code})</strong>
                </p>
              </div>

              {isQuoteLoading ? (
                <div className="py-12 text-center text-xs text-text-muted flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Kargo tarifesi hesaplanıyor...</span>
                </div>
              ) : quote ? (
                <div className="p-5 border border-text-primary rounded-xs bg-surface-secondary/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-text-primary shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">
                        Standart Sigortalı Kargo
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        {quote.estimated_delivery_text || '2-4 İş Günü'} • Korumalı Özel Ambalaj
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-text-primary">
                    {quote.free_shipping_applied ? (
                      <span className="text-feedback-success">Ücretsiz</span>
                    ) : (
                      `${quote.shipping_minor / 100} ₺`
                    )}
                  </span>
                </div>
              ) : null}

              <div className="pt-6 border-t border-border-subtle flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Fatura Adresine Dön
                </button>
                <button
                  type="button"
                  disabled={!quote || isQuoteLoading}
                  onClick={() => setCurrentStep(4)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-text-primary text-canvas-default text-xs font-semibold hover:opacity-90 disabled:opacity-40"
                >
                  Sipariş Özetine Geç
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Order Summary & Legal Acceptance */}
          {currentStep === 4 && quote && (
            <div className="space-y-8">
              <OrderSummaryStep quote={quote} />

              <LegalConsentStep
                acceptedPreliminaryInfo={acceptedPreliminaryInfo}
                acceptedDistanceSales={acceptedDistanceSales}
                onTogglePreliminaryInfo={setAcceptedPreliminaryInfo}
                onToggleDistanceSales={setAcceptedDistanceSales}
              />

              <div className="pt-6 border-t border-border-subtle flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kargo Adımına Dön
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || !acceptedPreliminaryInfo || !acceptedDistanceSales}
                  onClick={handleCreateOrder}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-text-primary text-canvas-default text-xs font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sipariş Oluşturuluyor...</span>
                    </>
                  ) : (
                    <>
                      <span>Siparişi Onayla & Ödemeye Geç</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Payment Boundary (Phase 3.5 Ready) */}
          {currentStep === 5 && createdOrder && (
            <div className="space-y-6">
              <PaymentBoundaryStep orderResponse={createdOrder} />

              <div className="pt-6 border-t border-border-subtle flex justify-center">
                <Link
                  to="/account/orders"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-surface-muted text-text-primary text-xs font-semibold rounded-xs hover:bg-surface-secondary"
                >
                  Siparişlerime Git
                </Link>
              </div>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}

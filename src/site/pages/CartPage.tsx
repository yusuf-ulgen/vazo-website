import { Link } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowRight, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { useCart } from '@/shared/stores/cart-store';
import { formatCurrency } from '@/shared/lib/formatters';
import { Container } from '@/shared/ui/Container';
import { QuantitySelector } from '@/shared/ui/QuantitySelector';

export function CartPage() {
  const {
    items,
    totalItems,
    subtotal,
    freeShippingThreshold,
    isFreeShipping,
    freeShippingRemaining,
    updateQuantity,
    removeItem,
    clear,
  } = useCart();

  return (
    <div className="w-full bg-canvas-default min-h-screen py-10 md:py-16">
      <Container size="lg">
        {/* Header */}
        <div className="space-y-3 mb-8 border-b border-border-subtle pb-6 text-left">
          <nav className="text-xs text-text-muted flex items-center gap-1.5 font-sans">
            <Link to="/" className="hover:text-text-primary transition-colors">Ana Sayfa</Link>
            <span>/</span>
            <span className="text-text-primary font-medium">Alışveriş Sepeti</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-text-primary">
                Alışveriş Sepetim
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-1 font-sans">
                {totalItems > 0
                  ? `Sepetinizde ${totalItems} adet ürün bulunmaktadır.`
                  : 'Sepetinizde henüz ürün bulunmamaktadır.'}
              </p>
            </div>

            {items.length > 0 && (
              <button
                type="button"
                onClick={clear}
                className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-feedback-danger transition-colors self-start sm:self-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sepeti Boşalt</span>
              </button>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          /* Empty State */
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 bg-surface-muted mx-auto flex items-center justify-center text-text-muted">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="font-display text-2xl text-text-primary">Sepetiniz Boş</h2>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Stüdyomuzun el işçiliği seramik koleksiyonlarını inceleyerek evinize veya projenize uygun parçaları seçebilirsiniz.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-action-primary text-action-primary-text px-8 py-3.5 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors shadow-xs"
              >
                <span>Kataloğu İncele</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start text-left">
            {/* Items Column (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Free shipping banner */}
              <div className="p-4 bg-surface-secondary border border-border-subtle text-xs">
                {isFreeShipping ? (
                  <div className="flex items-center gap-2 text-feedback-success font-medium">
                    <Sparkles className="w-4 h-4" />
                    <span>Tebrikler! Siparişiniz ücretsiz kargo kapsamındadır.</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-text-secondary">
                      Ücretsiz kargo için sepetinize <strong className="text-text-primary">{formatCurrency(freeShippingRemaining)}</strong> tutarında ürün daha ekleyin.
                    </p>
                    <div className="w-full bg-border-default h-1.5 overflow-hidden">
                      <div
                        className="bg-action-primary h-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="divide-y divide-border-subtle border-y border-border-subtle">
                {items.map((item) => (
                  <div key={item.id} className="py-6 flex gap-4 sm:gap-6 items-start">
                    <div className="w-20 sm:w-24 aspect-[3/4] bg-surface-secondary overflow-hidden shrink-0">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/products/${item.productSlug}`}
                          className="font-display text-base sm:text-lg text-text-primary hover:underline line-clamp-1"
                        >
                          {item.productName}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          aria-label="Ürünü Kaldır"
                          className="p-1 text-text-muted hover:text-feedback-danger transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs text-text-secondary">{item.variantName}</p>
                      <p className="text-xs font-semibold text-text-primary pt-1">
                        {formatCurrency(item.retailPrice)}
                      </p>

                      <div className="pt-3 flex items-center justify-between">
                        <QuantitySelector
                          quantity={item.quantity}
                          size="sm"
                          onChange={(qty) => updateQuantity(item.id, qty)}
                        />

                        <span className="text-xs sm:text-sm font-semibold text-text-primary">
                          {formatCurrency(item.retailPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 text-xs">
                <Link to="/products" className="text-text-secondary hover:text-text-primary underline">
                  ← Alışverişe Devam Et
                </Link>
              </div>
            </div>

            {/* Order Summary Column (4 cols) */}
            <div className="lg:col-span-4 p-6 bg-surface-secondary border border-border-default space-y-6">
              <h2 className="font-display text-xl text-text-primary border-b border-border-subtle pb-3">
                Sipariş Özeti
              </h2>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-text-secondary">
                  <span>Ara Toplam</span>
                  <span className="font-semibold text-text-primary">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between text-text-secondary">
                  <span>Tahmini Kargo</span>
                  <span className="text-text-primary font-medium">
                    {isFreeShipping ? 'Ücretsiz' : '₺120 (Ödeme adımında)'}
                  </span>
                </div>

                <div className="flex justify-between text-text-secondary">
                  <span>KDV (%20)</span>
                  <span className="text-text-primary">Dahil</span>
                </div>

                <div className="flex justify-between text-base font-semibold text-text-primary pt-3 border-t border-border-subtle">
                  <span>Genel Toplam</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
              </div>

              {/* Explicit Checkout Notice & Button */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    alert('Ödeme sağlayıcı entegrasyonu (Iyzico / Stripe / PayTR) onay sürecindedir. Sepetiniz ve sipariş kalemleriniz güvenle korunmaktadır.');
                  }}
                  className="w-full bg-action-primary text-action-primary-text py-4 px-6 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Ödemeye Geç</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="p-3 bg-surface-primary border border-border-subtle space-y-1 text-[11px] text-text-muted">
                  <div className="flex items-center gap-1.5 text-text-secondary font-medium">
                    <AlertCircle className="w-3.5 h-3.5 text-feedback-info shrink-0" />
                    <span>Ödeme Altyapısı Bilgilendirmesi</span>
                  </div>
                  <p>
                    Ödeme geçidi entegrasyonu sonraki aşamada canlıya alınacaktır. Sahte veya güvencesiz ödeme akışı sunulmamaktadır.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-text-muted text-center pt-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-feedback-success" />
                  <span>Güvenli Alışveriş & Koruyucu Sevkiyat</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}

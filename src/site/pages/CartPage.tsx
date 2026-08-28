import { Link } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowRight, ShieldCheck, AlertCircle, Truck } from 'lucide-react';
import { useCart } from '@/shared/stores/cart-store';
import { formatCurrency } from '@/shared/lib/formatters';
import { Container } from '@/shared/ui/Container';
import { QuantitySelector } from '@/shared/ui/QuantitySelector';

export function CartPage() {
  const {
    items,
    totalItems,
    subtotal,
    updateQuantity,
    removeItem,
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

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <h1 className="font-display text-2xl md:text-3xl text-text-primary tracking-tight">
              Alışveriş Sepeti
            </h1>
            <p className="text-xs text-text-muted">
              {totalItems > 0 ? `Sepetinizde ${totalItems} ürün bulunmaktadır` : 'Sepetiniz henüz boş'}
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          /* Empty State */
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 bg-surface-muted flex items-center justify-center text-text-muted mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="font-display text-xl text-text-primary">Sepetiniz Boş</h2>
              <p className="text-xs text-text-secondary">
                Koleksiyonumuzdaki el yapımı heykelsi vazo tasarımlarını inceleyerek hemen alışverişe başlayabilirsiniz.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-action-primary text-action-primary-text text-xs uppercase tracking-wider font-medium hover:bg-neutral-800 transition-colors"
              >
                Ürünleri Keşfet
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start text-left">
            {/* Items Column (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Shipping Notice banner */}
              <div className="p-4 bg-surface-secondary border border-border-subtle text-xs">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Truck className="w-4 h-4 shrink-0 text-text-muted" />
                  <span>Kargo ücreti teslimat ülkesine göre ödeme adımında hesaplanır.</span>
                </div>
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
                    Ödeme adımında hesaplanır
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

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingBag, Trash2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useCart } from '@/shared/stores/cart-store';
import { formatCurrency } from '@/shared/lib/formatters';
import { QuantitySelector } from '@/shared/ui/QuantitySelector';

export interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const {
    items,
    totalItems,
    subtotal,
    freeShippingThreshold,
    isFreeShipping,
    freeShippingRemaining,
    updateQuantity,
    removeItem,
  } = useCart();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Alışveriş Sepeti Çekmecesi"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm transition-opacity duration-200"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-surface-primary shadow-elevated flex flex-col justify-between z-50 transition-transform duration-300">
        {/* Header */}
        <div className="p-5 border-b border-border-default flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-text-primary" />
            <h2 className="font-display text-xl text-text-primary">Alışveriş Sepeti</h2>
            <span className="text-xs bg-surface-muted px-2 py-0.5 font-semibold text-text-secondary">
              {totalItems} Ürün
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Sepeti Kapat"
            className="p-1 text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress */}
        <div className="bg-surface-secondary px-5 py-3 border-b border-border-subtle text-xs">
          {isFreeShipping ? (
            <div className="flex items-center gap-1.5 text-feedback-success font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Tebrikler! Siparişiniz için kargo ücretsiz.</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-text-secondary">
                Ücretsiz kargo için <span className="font-semibold text-text-primary">{formatCurrency(freeShippingRemaining)}</span> daha ekleyin.
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

        {/* Items list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-left">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
              <div className="w-16 h-16 bg-surface-muted flex items-center justify-center text-text-muted">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-xs">
                <p className="font-display text-lg text-text-primary">Sepetiniz Boş</p>
                <p className="text-xs text-text-secondary">
                  Koleksiyonumuzdaki heykelsi vazo modellerini keşfederek alışverişe başlayın.
                </p>
              </div>
              <Link
                to="/products"
                onClick={onClose}
                className="inline-flex items-center gap-2 bg-action-primary text-action-primary-text px-6 py-3 text-xs uppercase font-semibold tracking-wide hover:bg-neutral-800 transition-colors"
              >
                <span>Koleksiyonu İncele</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 pb-4 border-b border-border-subtle items-start"
              >
                {/* Image */}
                <div className="w-20 h-24 bg-surface-secondary overflow-hidden shrink-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-muted" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 space-y-1 min-w-0">
                  <Link
                    to={`/products/${item.productSlug}`}
                    onClick={onClose}
                    className="font-display text-base text-text-primary hover:underline line-clamp-1 block"
                  >
                    {item.productName}
                  </Link>
                  <p className="text-xs text-text-secondary">{item.variantName}</p>
                  <p className="text-xs font-semibold text-text-primary pt-1">
                    {formatCurrency(item.retailPrice)}
                  </p>

                  <div className="pt-2 flex items-center justify-between">
                    <QuantitySelector
                      quantity={item.quantity}
                      size="sm"
                      onChange={(newQty) => updateQuantity(item.id, newQty)}
                    />

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-text-muted hover:text-feedback-danger transition-colors"
                      aria-label="Ürünü Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-5 border-t border-border-default bg-surface-secondary space-y-4 text-left">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-text-secondary">
                <span>Ara Toplam</span>
                <span className="font-semibold text-text-primary">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Tahmini Kargo</span>
                <span className="text-text-primary">
                  {isFreeShipping ? 'Ücretsiz' : '₺120 (Ödeme adımında hesaplanır)'}
                </span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-text-primary pt-2 border-t border-border-subtle">
                <span>Toplam</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <div className="space-y-2">
              <Link
                to="/cart"
                onClick={onClose}
                className="w-full bg-action-primary text-action-primary-text py-3.5 px-6 text-xs uppercase font-semibold tracking-wide hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
              >
                <span>Sepete Git & Öde</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-text-muted text-center pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-feedback-success" />
                <span>Güvenli Alışveriş ve Sigortalı Sevkiyat</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

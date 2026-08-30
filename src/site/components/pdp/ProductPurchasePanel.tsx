import { useState } from 'react';
import { Heart, Truck, ShieldCheck, RefreshCw, Tag } from 'lucide-react';
import { Product, ProductVariant, WholesalePricingTier } from '@/entities/product/types';
import { formatCurrency } from '@/shared/lib/formatters';
import { useCart, resolveCartItemPricing } from '@/shared/stores/cart-store';
import { useWishlist } from '@/shared/stores/wishlist-store';
import { QuantitySelector } from '@/shared/ui/QuantitySelector';
import { ProductWholesaleTiers } from './ProductWholesaleTiers';

export interface ProductPurchasePanelProps {
  product: Product;
  selectedVariant?: ProductVariant;
  onSelectVariant: (variant: ProductVariant) => void;
}

export function ProductPurchasePanel({
  product,
  selectedVariant,
  onSelectVariant,
}: ProductPurchasePanelProps) {
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  const { addItem } = useCart();
  const { has, toggle } = useWishlist();
  const isFavorite = has(product.id);

  const activeVariant = selectedVariant || product.variants[0];
  const activePrice = activeVariant?.retailPrice ?? product.retailPrice;
  const comparePrice = activeVariant?.compareAtPrice ?? product.compareAtPrice;

  const variants = product.variants;
  const stock = activeVariant ? (activeVariant.stockQuantity ?? 0) : 0;
  const isOutOfStock = stock <= 0;
  const isRetailAvailable = (product.retailEnabled ?? true) && (activeVariant?.isAvailableForRetail ?? true);

  const activeTiers: WholesalePricingTier[] =
    product.wholesale?.tiers && product.wholesale.tiers.length > 0
      ? product.wholesale.tiers
      : product.wholesale?.isWholesaleEnabled
      ? [
          { minQuantity: 6, maxQuantity: 11, unitPrice: Math.round(activePrice * 0.8), discountPercentage: 20 },
          { minQuantity: 12, maxQuantity: 23, unitPrice: Math.round(activePrice * 0.75), discountPercentage: 25 },
          { minQuantity: 24, maxQuantity: 49, unitPrice: Math.round(activePrice * 0.7), discountPercentage: 30 },
          { minQuantity: 50, maxQuantity: undefined, unitPrice: Math.round(activePrice * 0.6), discountPercentage: 40 },
        ]
      : [];

  const tierPricing = resolveCartItemPricing(activePrice, quantity, activeTiers);

  const handleAddToCart = () => {
    if (isOutOfStock || !isRetailAvailable) return;
    addItem(product, activeVariant, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Brand & Title */}
      <div className="space-y-1.5 border-b border-border-subtle pb-4">
        <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
          Vazo Studio
        </span>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-text-primary uppercase tracking-tight">
          {product.name}
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary font-sans">
          {product.material}
        </p>

        {/* Price & Tax Note */}
        <div className="pt-2 flex items-baseline gap-3">
          <span className="font-sans text-2xl sm:text-3xl font-semibold text-text-primary">
            {formatCurrency(activePrice)}
          </span>
          {comparePrice && comparePrice > activePrice && (
            <span className="text-sm text-text-muted line-through">
              {formatCurrency(comparePrice)}
            </span>
          )}
          <span className="text-xs text-text-muted font-normal">
            (KDV Dahil)
          </span>
        </div>
      </div>

      {/* Color Swatches (if variants exist) */}
      {variants.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-text-primary">
              Renk:{' '}
              <span className="font-normal text-text-secondary">
                {activeVariant?.colorName || 'Standart'}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelectVariant(v)}
                title={v.colorName}
                aria-label={`Renk: ${v.colorName}`}
                className={`w-7 h-7 rounded-full transition-all relative flex items-center justify-center ${
                  activeVariant?.id === v.id
                    ? 'ring-2 ring-text-primary ring-offset-2 scale-110'
                    : 'ring-1 ring-border-strong opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: v.colorHex || '#E5E0D8' }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Material & Dimension Specs */}
      <div className="space-y-1.5 py-3 border-y border-border-subtle text-xs font-sans">
        <p className="text-text-secondary">
          <strong className="font-medium text-text-primary uppercase tracking-wide">Malzeme:</strong>{' '}
          {product.material} ({product.finish})
        </p>
        {activeVariant?.dimensions && (
          <p className="text-text-secondary">
            <strong className="font-medium text-text-primary uppercase tracking-wide">Ölçüler:</strong>{' '}
            {`Yükseklik: ${activeVariant.dimensions.heightCm} cm • Çap: ${activeVariant.dimensions.diameterCm} cm • Ağırlık: ${activeVariant.dimensions.weightKg} kg`}
          </p>
        )}
      </div>

      {/* Quantity & Stock Indicator */}
      <div className="space-y-2">
        <span className="text-xs uppercase font-semibold tracking-wider text-text-primary">
          Adet
        </span>
        <div className="flex items-center gap-4">
          <QuantitySelector
            quantity={isOutOfStock ? 0 : quantity}
            onChange={(q) => setQuantity(q)}
            min={isOutOfStock ? 0 : 1}
            max={isOutOfStock ? 0 : stock}
            disabled={isOutOfStock || !isRetailAvailable}
          />
          {isOutOfStock ? (
            <span className="text-xs text-feedback-danger font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-feedback-danger inline-block" />
              Tükendi (Stokta Yok)
            </span>
          ) : !isRetailAvailable ? (
            <span className="text-xs text-text-muted font-medium">
              Yalnızca Toptan Satış
            </span>
          ) : (
            <span className="text-xs text-feedback-success font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-feedback-success inline-block" />
              Stokta Mevcut ({stock} adet)
            </span>
          )}
        </div>

        {tierPricing.discountPercentage && tierPricing.unitPrice < activePrice && (
          <div className="p-2.5 bg-feedback-success/10 border border-feedback-success/20 rounded flex items-center justify-between text-xs text-text-primary animate-fade-in">
            <div className="flex items-center gap-1.5 font-medium text-feedback-success">
              <Tag className="w-3.5 h-3.5" />
              <span>%{tierPricing.discountPercentage} Toplu Alım İndirimi</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold">{formatCurrency(tierPricing.unitPrice)} / adet</span>
              <span className="text-[11px] text-text-muted ml-1.5">(Toplam: {formatCurrency(tierPricing.unitPrice * quantity)})</span>
            </div>
          </div>
        )}
      </div>

      {/* Add to Cart & Wishlist Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          disabled={isOutOfStock || !isRetailAvailable}
          onClick={handleAddToCart}
          className={`flex-1 py-4 px-6 text-xs uppercase font-semibold tracking-wider transition-colors shadow-xs ${
            isOutOfStock || !isRetailAvailable
              ? 'bg-surface-muted text-text-muted cursor-not-allowed'
              : 'bg-action-primary text-action-primary-text hover:bg-neutral-800'
          }`}
        >
          {isOutOfStock
            ? 'Stokta Yok'
            : !isRetailAvailable
            ? 'Perakende Kapalı'
            : addedNotice
            ? 'Sepete Eklendi ✓'
            : 'Sepete Ekle'}
        </button>

        <button
          type="button"
          onClick={() => toggle(product.id)}
          aria-label={isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
          className="p-4 border border-border-strong text-text-primary hover:bg-surface-secondary transition-colors"
        >
          <Heart
            className={`w-5 h-5 ${isFavorite ? 'fill-current text-text-primary' : ''}`}
          />
        </button>
      </div>

      {/* Trust Strip */}
      <div className="grid grid-cols-3 gap-2 py-4 border-t border-border-subtle text-center text-[11px] font-sans text-text-secondary">
        <div className="flex flex-col items-center space-y-1">
          <Truck className="w-4 h-4 text-text-primary" />
          <span>Özenli Paketleme<br/><span className="text-[10px] text-text-muted">Darbeye Dayanıklı</span></span>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <ShieldCheck className="w-4 h-4 text-text-primary" />
          <span>El İşçiliği Garanti<br/><span className="text-[10px] text-text-muted">1250°C Stoneware</span></span>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <RefreshCw className="w-4 h-4 text-text-primary" />
          <span>İade & Değişim<br/><span className="text-[10px] text-text-muted">14 Gün İçinde</span></span>
        </div>
      </div>

      {/* Wholesale Tier Module */}
      {product.wholesale.isWholesaleEnabled && product.wholesale.tiers.length > 0 && (
        <ProductWholesaleTiers
          tiers={product.wholesale.tiers}
          productName={product.name}
          retailPrice={activePrice}
          productSlug={product.slug}
        />
      )}
    </div>
  );
}

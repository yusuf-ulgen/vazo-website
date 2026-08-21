import { useState } from 'react';
import { Heart, Truck, ShieldCheck, RefreshCw } from 'lucide-react';
import { Product, ProductVariant } from '@/entities/product/types';
import { formatCurrency } from '@/shared/lib/formatters';
import { useCart } from '@/shared/stores/cart-store';
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
  const activePrice = activeVariant?.retailPrice || product.retailPrice;
  const comparePrice = activeVariant?.compareAtPrice || product.compareAtPrice;

  // Swatch colors with default fallback palette
  const variants = product.variants.length > 0
    ? product.variants
    : [
        { id: '1', sku: product.slug, name: 'Tebeşir Beyazı', colorName: 'Tebeşir Beyazı', colorHex: '#FAF9F6', finish: 'matte' as const, dimensions: { heightCm: 28, diameterCm: 18, weightKg: 1.8 }, retailPrice: product.retailPrice, stockQuantity: 20, isAvailableForRetail: true, isAvailableForWholesale: true },
        { id: '2', sku: `${product.slug}-snd`, name: 'Kum Beji', colorName: 'Kum Beji', colorHex: '#E4D9C0', finish: 'matte' as const, dimensions: { heightCm: 28, diameterCm: 18, weightKg: 1.8 }, retailPrice: product.retailPrice, stockQuantity: 15, isAvailableForRetail: true, isAvailableForWholesale: true },
        { id: '3', sku: `${product.slug}-chr`, name: 'Antrasit Taş', colorName: 'Antrasit Taş', colorHex: '#2D2923', finish: 'textured' as const, dimensions: { heightCm: 28, diameterCm: 18, weightKg: 1.8 }, retailPrice: product.retailPrice, stockQuantity: 10, isAvailableForRetail: true, isAvailableForWholesale: true },
      ];

  const handleAddToCart = () => {
    addItem(product, activeVariant, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Brand & Title (Reference 04) */}
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
            (Vergi / KDV Dahil)
          </span>
        </div>
      </div>

      {/* Color Swatches (Reference 04) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold uppercase tracking-wider text-text-primary">
            Renk: <span className="font-normal text-text-secondary">{activeVariant?.colorName || 'Standart'}</span>
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {variants.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelectVariant(v as ProductVariant)}
              title={v.colorName}
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

      {/* Material & Dimension Specs (Reference 04) */}
      <div className="space-y-1.5 py-3 border-y border-border-subtle text-xs font-sans">
        <p className="text-text-secondary">
          <strong className="font-medium text-text-primary uppercase tracking-wide">Malzeme:</strong>{' '}
          {product.material}
        </p>
        <p className="text-text-secondary">
          <strong className="font-medium text-text-primary uppercase tracking-wide">Ölçüler:</strong>{' '}
          {activeVariant?.dimensions?.heightCm
            ? `Yükseklik: ${activeVariant.dimensions.heightCm} cm • Çap: ${activeVariant.dimensions.diameterCm || 16} cm • Ağırlık: ${activeVariant.dimensions.weightKg || 1.8} kg`
            : 'Yükseklik: 28 cm • Genişlik: 18 cm • Ağız Çapı: 6 cm'}
        </p>
      </div>

      {/* Quantity & Stock Indicator */}
      <div className="space-y-2">
        <span className="text-xs uppercase font-semibold tracking-wider text-text-primary">
          Adet
        </span>
        <div className="flex items-center gap-4">
          <QuantitySelector
            quantity={quantity}
            onChange={(q) => setQuantity(q)}
            min={1}
            max={activeVariant?.stockQuantity || 50}
          />
          <span className="text-xs text-feedback-success font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-feedback-success inline-block" />
            Stokta var (Hızlı Kargo)
          </span>
        </div>
      </div>

      {/* Add to Cart & Wishlist Buttons (Reference 04) */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleAddToCart}
          className="flex-1 bg-action-primary text-action-primary-text py-4 px-6 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors shadow-xs"
        >
          {addedNotice ? 'Sepete Eklendi ✓' : 'Sepete Ekle'}
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

      {/* Trust Strip (Reference 04) */}
      <div className="grid grid-cols-3 gap-2 py-4 border-t border-border-subtle text-center text-[11px] font-sans text-text-secondary">
        <div className="flex flex-col items-center space-y-1">
          <Truck className="w-4 h-4 text-text-primary" />
          <span>Ücretsiz Kargo<br/><span className="text-[10px] text-text-muted">5.000 TL üzeri</span></span>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <ShieldCheck className="w-4 h-4 text-text-primary" />
          <span>Güvenli Ödeme<br/><span className="text-[10px] text-text-muted">256-bit SSL</span></span>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <RefreshCw className="w-4 h-4 text-text-primary" />
          <span>Kolay İade<br/><span className="text-[10px] text-text-muted">14 gün içinde</span></span>
        </div>
      </div>

      {/* Wholesale Tier Module (Reference 04) */}
      <ProductWholesaleTiers
        tiers={product.wholesale.tiers}
        productName={product.name}
        retailPrice={activePrice}
        productSlug={product.slug}
      />
    </div>
  );
}

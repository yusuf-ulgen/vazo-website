import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Product } from '@/entities/product/types';
import { formatCurrency } from '@/shared/lib/formatters';
import { useWishlist } from '@/shared/stores/wishlist-store';
import { ProductImage } from '@/shared/ui/ProductImage';
import { cn } from '@/shared/lib/cn';

export interface ProductCardProps {
  product: Product;
  aspectRatio?: 'portrait' | 'square';
  className?: string;
  showWholesaleBadge?: boolean;
}

export function ProductCard({
  product,
  aspectRatio = 'portrait',
  className,
  showWholesaleBadge = false,
}: ProductCardProps) {
  const { has, toggle } = useWishlist();
  const isFavorite = has(product.id);

  const primaryImage =
    product.images.find((img) => img.isPrimary) || product.images[0];
  const lowestWholesalePrice = product.wholesale.tiers[product.wholesale.tiers.length - 1]?.unitPrice;

  return (
    <div className={cn('group relative flex flex-col', className)}>
      {/* Image Container with Badges and Wishlist Button */}
      <div className="relative w-full overflow-hidden bg-surface-secondary">
        <Link to={`/products/${product.slug}`} className="block">
          <ProductImage
            src={primaryImage?.url}
            alt={primaryImage?.alt || product.name}
            aspectRatio={aspectRatio}
            className="w-full"
          />
        </Link>

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
          {product.isNewArrival && (
            <span className="bg-surface-primary/95 text-text-primary text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 shadow-xs border border-border-subtle">
              Yeni
            </span>
          )}
          {product.isBestseller && !product.isNewArrival && (
            <span className="bg-canvas-warm/95 text-text-primary text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 shadow-xs border border-border-subtle">
              Çok Satan
            </span>
          )}
        </div>

        {/* Wishlist Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle(product.id);
          }}
          aria-label={isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
          className="absolute top-2.5 right-2.5 p-2 bg-surface-primary/80 hover:bg-surface-primary text-text-primary transition-all duration-200 shadow-xs z-10 focus:outline-none"
        >
          <Heart
            className={cn(
              'w-4 h-4 transition-colors duration-200',
              isFavorite ? 'fill-current text-text-primary' : 'text-text-secondary hover:text-text-primary'
            )}
          />
        </button>
      </div>

      {/* Product Details */}
      <div className="pt-3.5 space-y-1 text-left flex-1 flex flex-col justify-between">
        <div>
          <Link
            to={`/products/${product.slug}`}
            className="font-display text-sm md:text-base font-normal tracking-wide text-text-primary uppercase hover:opacity-70 transition-opacity line-clamp-1"
          >
            {product.name}
          </Link>
          <p className="text-[11px] text-text-secondary font-sans font-normal tracking-wide line-clamp-1">
            {product.material}
          </p>
        </div>

        <div className="pt-1 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-sans text-xs md:text-sm font-semibold text-text-primary">
              {formatCurrency(product.retailPrice)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.retailPrice && (
              <span className="text-[11px] text-text-muted line-through">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>

          {showWholesaleBadge && lowestWholesalePrice && (
            <span className="text-[10px] text-feedback-success font-medium tracking-wide">
              B2B: {formatCurrency(lowestWholesalePrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

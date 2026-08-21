import { Link } from 'react-router-dom';
import { Product } from '@/entities/product/types';
import { formatCurrency, formatDimensions } from '@/shared/lib/formatters';
import { Badge } from '@/shared/ui/Badge';

export interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
  const primaryVariant = product.variants[0];

  return (
    <article className="group flex flex-col bg-surface-primary border border-border-subtle hover:border-border-default transition-all duration-300">
      {/* Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-secondary">
        {primaryImage && (
          <img
            src={primaryImage.url}
            alt={primaryImage.alt || product.name}
            className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />
        )}

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.isNewArrival && <Badge variant="muted">Yeni</Badge>}
          {product.isBestseller && <Badge variant="default">Bestseller</Badge>}
        </div>

        {/* Wholesale indicator */}
        {product.wholesale.isWholesaleEnabled && (
          <div className="absolute bottom-3 left-3 z-10">
            <Badge variant="wholesale">
              Toptan MOQ: {product.wholesale.minOrderQuantity} Adet
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          <p className="text-[11px] uppercase tracking-editorial text-text-secondary font-medium">
            {product.material} • {formatDimensions(primaryVariant?.dimensions)}
          </p>
          <h3 className="font-display text-lg text-text-primary group-hover:opacity-75 transition-opacity">
            <Link to={`/products/${product.slug}`}>
              {product.name}
            </Link>
          </h3>
        </div>

        {/* Price Row: Retail & Wholesale Context */}
        <div className="pt-2 border-t border-border-subtle flex items-baseline justify-between text-xs">
          <div>
            <span className="text-text-muted text-[10px] block uppercase">Perakende</span>
            <span className="font-sans font-semibold text-text-primary">
              {formatCurrency(product.retailPrice)}
            </span>
          </div>

          {product.wholesale.isWholesaleEnabled && product.wholesale.tiers[0] && (
            <div className="text-right">
              <span className="text-text-muted text-[10px] block uppercase">Toptan Başlangıç</span>
              <span className="font-sans font-medium text-feedback-success">
                {formatCurrency(product.wholesale.tiers[0].unitPrice)}
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

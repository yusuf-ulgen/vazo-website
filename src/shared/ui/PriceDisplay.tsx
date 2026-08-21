import { formatCurrency } from '@/shared/lib/formatters';
import { cn } from '@/shared/lib/cn';

export interface PriceDisplayProps {
  retailPrice: number;
  compareAtPrice?: number;
  wholesaleUnitPrice?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showVatNote?: boolean;
  className?: string;
}

export function PriceDisplay({
  retailPrice,
  compareAtPrice,
  wholesaleUnitPrice,
  size = 'md',
  showVatNote = false,
  className,
}: PriceDisplayProps) {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm sm:text-base',
    lg: 'text-lg sm:text-xl font-medium',
    xl: 'text-2xl sm:text-3xl font-normal font-display',
  };

  const hasDiscount = compareAtPrice && compareAtPrice > retailPrice;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-baseline gap-2.5">
        <span className={cn('font-sans font-semibold text-text-primary', sizeClasses[size])}>
          {formatCurrency(retailPrice)}
        </span>

        {hasDiscount && (
          <span className="text-xs sm:text-sm text-text-muted line-through">
            {formatCurrency(compareAtPrice)}
          </span>
        )}

        {showVatNote && (
          <span className="text-[11px] text-text-muted font-normal">
            (KDV Dahil)
          </span>
        )}
      </div>

      {wholesaleUnitPrice !== undefined && wholesaleUnitPrice < retailPrice && (
        <div className="text-[11px] text-feedback-success font-medium">
          Toptan Başlangıç Fiyatı: {formatCurrency(wholesaleUnitPrice)} + KDV
        </div>
      )}
    </div>
  );
}

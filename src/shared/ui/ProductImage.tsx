import { useState } from 'react';
import { cn } from '@/shared/lib/cn';

export interface ProductImageProps {
  src?: string;
  alt: string;
  aspectRatio?: 'portrait' | 'square' | 'wide' | 'editorial';
  className?: string;
  priority?: boolean;
  onHoverZoom?: boolean;
}

export function ProductImage({
  src,
  alt,
  aspectRatio = 'portrait',
  className,
  priority = false,
  onHoverZoom = true,
}: ProductImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(!src);

  const aspectClasses = {
    portrait: 'aspect-[3/4]',
    square: 'aspect-square',
    wide: 'aspect-[16/9]',
    editorial: 'aspect-[4/5]',
  };

  const fallbackUrl =
    'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80';

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden bg-surface-secondary',
        aspectClasses[aspectRatio],
        className
      )}
    >
      {/* Loading Skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-surface-muted animate-pulse" />
      )}

      {/* Image */}
      <img
        src={hasError || !src ? fallbackUrl : src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
        className={cn(
          'w-full h-full object-cover object-center transition-all duration-700 ease-out',
          !isLoaded && 'opacity-0 scale-95',
          isLoaded && 'opacity-100 scale-100',
          onHoverZoom && 'group-hover:scale-105'
        )}
      />
    </div>
  );
}

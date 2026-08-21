import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export interface EditorialHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4';
  size?: 'hero' | 'xl' | 'lg' | 'md' | 'sm';
  italicSubtitle?: string;
}

export function EditorialHeading({
  as: Component = 'h2',
  size = 'lg',
  italicSubtitle,
  className,
  children,
  ...props
}: EditorialHeadingProps) {
  const sizeClasses = {
    hero: 'font-display text-4xl sm:text-5xl lg:text-6xl font-light leading-[1.08] tracking-tight',
    xl: 'font-display text-3xl sm:text-4xl lg:text-5xl font-light leading-[1.15]',
    lg: 'font-display text-2xl sm:text-3xl lg:text-4xl font-normal leading-[1.2]',
    md: 'font-display text-xl sm:text-2xl font-normal leading-[1.25]',
    sm: 'font-display text-lg sm:text-xl font-medium leading-[1.3]',
  };

  return (
    <Component
      className={cn('text-text-primary', sizeClasses[size], className)}
      {...props}
    >
      {children}
      {italicSubtitle && (
        <>
          {' '}
          <span className="font-normal italic text-text-secondary">
            {italicSubtitle}
          </span>
        </>
      )}
    </Component>
  );
}

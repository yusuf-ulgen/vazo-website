import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'muted' | 'accent' | 'outlined';
}

export function Card({
  className,
  variant = 'default',
  children,
  ...props
}: CardProps) {
  const variantClasses = {
    default: 'bg-surface-primary border border-border-default shadow-subtle',
    muted: 'bg-surface-secondary border border-border-subtle',
    accent: 'bg-surface-muted border border-brand-stone/30',
    outlined: 'bg-transparent border border-border-default',
  };

  return (
    <div
      className={cn(
        'transition-shadow duration-200',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

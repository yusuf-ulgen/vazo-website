import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export interface EyebrowProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'muted';
}

export function Eyebrow({
  className,
  variant = 'default',
  children,
  ...props
}: EyebrowProps) {
  const variantClasses = {
    default: 'text-text-secondary',
    accent: 'text-text-primary',
    muted: 'text-text-muted',
  };

  return (
    <span
      className={cn(
        'inline-block text-xs uppercase font-semibold tracking-editorial',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

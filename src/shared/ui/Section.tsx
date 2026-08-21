import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  variant?: 'default' | 'subtle' | 'warm' | 'inverse';
  spacing?: 'sm' | 'md' | 'lg' | 'none';
}

export function Section({
  className,
  variant = 'default',
  spacing = 'lg',
  children,
  ...props
}: SectionProps) {
  const variantClasses = {
    default: 'bg-canvas-default text-text-primary',
    subtle: 'bg-canvas-subtle text-text-primary border-y border-border-subtle',
    warm: 'bg-canvas-warm text-text-primary border-y border-border-default',
    inverse: 'bg-surface-inverse text-text-inverse',
  };

  const spacingClasses = {
    none: 'py-0',
    sm: 'py-8 md:py-12',
    md: 'py-12 md:py-16',
    lg: 'py-16 md:py-24',
  };

  return (
    <section
      className={cn(variantClasses[variant], spacingClasses[spacing], className)}
      {...props}
    >
      {children}
    </section>
  );
}

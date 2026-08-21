import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'wholesale' | 'success' | 'warning' | 'danger' | 'muted';
}

export function Badge({
  className,
  variant = 'default',
  children,
  ...props
}: BadgeProps) {
  const variantClasses = {
    default: 'bg-surface-secondary text-text-primary border border-border-default',
    wholesale: 'bg-surface-inverse text-text-inverse tracking-wide uppercase',
    success: 'bg-feedback-success-surface text-feedback-success border border-feedback-success/20',
    warning: 'bg-feedback-warning-surface text-feedback-warning border border-feedback-warning/20',
    danger: 'bg-feedback-danger-surface text-feedback-danger border border-feedback-danger/20',
    muted: 'bg-surface-muted text-text-secondary border border-border-subtle',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 text-xs font-medium tracking-normal',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

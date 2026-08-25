import React from 'react';
import { cn } from '@/shared/lib/cn';

export interface AdminCardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'elevated' | 'secondary' | 'muted';
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}

export function AdminCard({
  title,
  subtitle,
  actions,
  footer,
  variant = 'default',
  className,
  bodyClassName,
  children,
}: AdminCardProps) {
  const variantStyles = {
    default: 'bg-surface-primary border border-border-default shadow-subtle',
    elevated: 'bg-surface-primary border border-border-default shadow-elevated',
    secondary: 'bg-surface-secondary border border-border-default',
    muted: 'bg-surface-muted border border-border-subtle',
  };

  const hasHeader = Boolean(title || actions);

  return (
    <section className={cn('rounded-none text-left', variantStyles[variant], className)}>
      {hasHeader && (
        <header className="px-5 py-4 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            {typeof title === 'string' ? (
              <h3 className="text-sm font-semibold text-text-primary truncate">{title}</h3>
            ) : (
              title
            )}
            {subtitle && (
              <p className="text-xs text-text-secondary leading-normal">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </header>
      )}

      <div className={cn('p-5', bodyClassName)}>{children}</div>

      {footer && (
        <footer className="px-5 py-3.5 bg-surface-secondary/50 border-t border-border-subtle flex items-center justify-between text-xs">
          {footer}
        </footer>
      )}
    </section>
  );
}

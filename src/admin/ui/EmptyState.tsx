import React from 'react';
import { PackageOpen } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = PackageOpen,
  title = 'Kayıt bulunamadı',
  description = 'Görüntülenecek herhangi bir veri veya içerik henüz eklenmemiş.',
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-3.5',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-surface-secondary border border-border-default flex items-center justify-center text-text-muted">
        <Icon className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
        <p className="text-xs text-text-secondary leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

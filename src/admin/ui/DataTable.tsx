import React from 'react';
import { LoadingSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { cn } from '@/shared/lib/cn';

export interface DataTableProps {
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function DataTable({
  toolbar,
  footer,
  isLoading = false,
  error,
  onRetry,
  isEmpty = false,
  emptyTitle = 'Kayıt bulunamadı',
  emptyDescription = 'Arama kriterlerinize uygun veri bulunamadı veya henüz kayıt eklenmedi.',
  emptyAction,
  className,
  children,
}: DataTableProps) {
  return (
    <div className={cn('bg-surface-primary border border-border-default shadow-subtle flex flex-col', className)}>
      {toolbar && (
        <div className="p-4 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-primary">
          {toolbar}
        </div>
      )}

      <div className="overflow-x-auto min-h-[160px] flex-1">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <LoadingSkeleton count={4} height="h-10" />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState error={error} onRetry={onRetry} />
          </div>
        ) : isEmpty ? (
          <div className="p-8">
            <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
          </div>
        ) : (
          <table className="w-full text-left text-xs divide-y divide-border-subtle">
            {children}
          </table>
        )}
      </div>

      {footer && !isLoading && !error && !isEmpty && (
        <div className="px-5 py-3 border-t border-border-subtle bg-surface-secondary/40">
          {footer}
        </div>
      )}
    </div>
  );
}

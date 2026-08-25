import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
  disabled?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
  disabled = false,
}: PaginationProps) {
  if (totalPages <= 1 && totalItems === undefined) {
    return null;
  }

  const startItem = totalItems !== undefined && pageSize !== undefined
    ? Math.min((currentPage - 1) * pageSize + 1, totalItems)
    : undefined;
  const endItem = totalItems !== undefined && pageSize !== undefined
    ? Math.min(currentPage * pageSize, totalItems)
    : undefined;

  return (
    <nav
      aria-label="Sayfalama"
      className={cn('flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary py-3', className)}
    >
      <div>
        {totalItems !== undefined && startItem !== undefined && endItem !== undefined ? (
          <span>
            Toplam <strong className="font-semibold text-text-primary">{totalItems}</strong> kayıttan{' '}
            <strong className="font-semibold text-text-primary">{startItem}-{endItem}</strong> arası gösteriliyor
          </span>
        ) : (
          <span>
            Sayfa <strong className="font-semibold text-text-primary">{currentPage}</strong> / {totalPages || 1}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={disabled || currentPage <= 1}
          aria-label="Önceki Sayfa"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-surface-primary border border-border-default hover:bg-surface-secondary text-text-primary disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Önceki</span>
        </button>

        <span className="px-2 py-1 font-mono text-xs font-medium text-text-primary">
          {currentPage} / {Math.max(totalPages, 1)}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={disabled || currentPage >= totalPages}
          aria-label="Sonraki Sayfa"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-surface-primary border border-border-default hover:bg-surface-secondary text-text-primary disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <span>Sonraki</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </nav>
  );
}

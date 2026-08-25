import { AlertCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface ErrorStateProps {
  title?: string;
  error?: string | Error | null;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Veriler yüklenirken hata oluştu',
  error,
  onRetry,
  className,
}: ErrorStateProps) {
  const errorMessage =
    typeof error === 'string'
      ? error
      : error instanceof Error
      ? error.message
      : 'Sunucuya bağlanırken beklenmeyen bir hata meydana geldi.';

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-3.5',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-feedback-danger-surface border border-feedback-danger/20 flex items-center justify-center text-feedback-danger">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-feedback-danger">{title}</h4>
        <p className="text-xs text-text-secondary leading-relaxed max-w-sm">{errorMessage}</p>
      </div>

      {onRetry && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-text-primary bg-surface-secondary hover:bg-surface-muted border border-border-default rounded transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Yeniden Dene</span>
          </button>
        </div>
      )}
    </div>
  );
}

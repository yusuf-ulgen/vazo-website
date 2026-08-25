import React, { useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { ToastContext, ToastItem, ToastOptions, ToastVariant } from './ToastContext';
import { cn } from '@/shared/lib/cn';

const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message, variant = 'info', duration = DEFAULT_DURATION }: ToastOptions) => {
      const id = 'toast_' + Math.random().toString(36).substring(2, 9) + Date.now();
      const newToast: ToastItem = {
        id,
        title,
        message,
        variant,
        duration,
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  const success = useCallback(
    (message: string, title?: string) => showToast({ message, title, variant: 'success' }),
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string) => showToast({ message, title, variant: 'error' }),
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string) => showToast({ message, title, variant: 'info' }),
    [showToast]
  );

  const warning = useCallback(
    (message: string, title?: string) => showToast({ message, title, variant: 'warning' }),
    [showToast]
  );

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        success,
        error,
        info,
        warning,
        dismissToast,
        clearAllToasts,
      }}
    >
      {children}

      {/* Toast Container */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const icons: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  };

  const borderAndBgStyles: Record<ToastVariant, string> = {
    success: 'bg-surface-primary border-feedback-success/40 text-text-primary',
    error: 'bg-feedback-danger-surface border-feedback-danger/30 text-feedback-danger',
    info: 'bg-surface-primary border-border-default text-text-primary',
    warning: 'bg-surface-primary border-brand-sand/60 text-text-primary',
  };

  const iconColors: Record<ToastVariant, string> = {
    success: 'text-feedback-success',
    error: 'text-feedback-danger',
    info: 'text-text-secondary',
    warning: 'text-amber-500',
  };

  const Icon = icons[toast.variant];

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex items-start gap-3 p-4 border shadow-elevated transition-all duration-200 animate-slide-in-right',
        borderAndBgStyles[toast.variant]
      )}
    >
      <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', iconColors[toast.variant])} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className="text-xs font-semibold leading-tight text-text-primary mb-0.5">
            {toast.title}
          </h4>
        )}
        <p className="text-xs leading-relaxed text-text-secondary">{toast.message}</p>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Bildirimi kapat"
        className="p-1 -mr-1 text-text-muted hover:text-text-primary transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

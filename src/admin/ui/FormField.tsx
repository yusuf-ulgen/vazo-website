import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  required = false,
  hint,
  error,
  htmlFor,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5 text-left', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-xs font-medium text-text-primary">
          {label}
          {required && <span className="text-feedback-danger ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}

      {children}

      {hint && !error && (
        <p className="text-[11px] text-text-muted leading-tight">{hint}</p>
      )}

      {error && (
        <p role="alert" className="text-[11px] text-feedback-danger flex items-center gap-1 leading-tight">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean | string;
}

export const AdminInput = React.forwardRef<HTMLInputElement, AdminInputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full px-3 py-2 text-xs bg-surface-primary border border-border-default focus:border-text-primary focus:outline-none text-text-primary placeholder:text-text-muted transition-colors disabled:opacity-50 disabled:bg-surface-secondary',
          error && 'border-feedback-danger focus:border-feedback-danger bg-feedback-danger-surface/20',
          className
        )}
        {...props}
      />
    );
  }
);
AdminInput.displayName = 'AdminInput';

export interface AdminSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean | string;
}

export const AdminSelect = React.forwardRef<HTMLSelectElement, AdminSelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'w-full px-3 py-2 text-xs bg-surface-primary border border-border-default focus:border-text-primary focus:outline-none text-text-primary transition-colors disabled:opacity-50 disabled:bg-surface-secondary',
          error && 'border-feedback-danger focus:border-feedback-danger',
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
AdminSelect.displayName = 'AdminSelect';

export interface AdminTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean | string;
}

export const AdminTextarea = React.forwardRef<HTMLTextAreaElement, AdminTextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full px-3 py-2 text-xs bg-surface-primary border border-border-default focus:border-text-primary focus:outline-none text-text-primary placeholder:text-text-muted transition-colors disabled:opacity-50 disabled:bg-surface-secondary resize-y',
          error && 'border-feedback-danger focus:border-feedback-danger bg-feedback-danger-surface/20',
          className
        )}
        {...props}
      />
    );
  }
);
AdminTextarea.displayName = 'AdminTextarea';

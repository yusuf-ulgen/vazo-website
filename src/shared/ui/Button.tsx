import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'px-4 py-2 text-xs tracking-wide',
      md: 'px-6 py-3 text-sm tracking-wide',
      lg: 'px-8 py-4 text-base tracking-wide',
    };

    const variantClasses = {
      primary:
        'bg-action-primary text-action-primary-text hover:bg-neutral-800 active:bg-neutral-950 disabled:bg-neutral-300 disabled:text-neutral-500',
      secondary:
        'bg-action-secondary text-action-secondary-text hover:bg-neutral-200 active:bg-neutral-300 disabled:bg-neutral-100 disabled:text-neutral-400',
      outline:
        'border border-text-primary text-text-primary bg-transparent hover:bg-neutral-50 active:bg-neutral-100 disabled:border-neutral-300 disabled:text-neutral-400',
      ghost:
        'text-text-primary bg-transparent hover:bg-neutral-100 active:bg-neutral-200 disabled:text-neutral-400',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-sans font-medium uppercase transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary focus-visible:ring-offset-2 select-none',
          sizeClasses[size],
          variantClasses[variant],
          isLoading && 'cursor-wait opacity-80',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Yükleniyor...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

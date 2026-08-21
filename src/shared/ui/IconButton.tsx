import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  variant?: 'default' | 'outline' | 'filled' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  badgeCount?: number;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon: Icon,
      label,
      variant = 'ghost',
      size = 'md',
      badgeCount,
      className,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-3',
    };

    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    const variantClasses = {
      ghost: 'text-text-primary hover:text-text-secondary transition-colors',
      default: 'bg-surface-secondary text-text-primary hover:bg-surface-tertiary transition-colors',
      outline: 'border border-border-default text-text-primary hover:bg-surface-secondary transition-colors',
      filled: 'bg-surface-inverse text-text-inverse hover:bg-neutral-800 transition-colors',
    };

    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        className={cn(
          'relative inline-flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        <Icon className={iconSizes[size]} />
        {badgeCount !== undefined && badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-surface-inverse text-text-inverse text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-sans font-bold shadow-xs">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

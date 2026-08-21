import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  variant?: 'subtle' | 'default' | 'strong';
}

export function Divider({
  variant = 'default',
  className,
  ...props
}: DividerProps) {
  const variantClasses = {
    subtle: 'border-border-subtle',
    default: 'border-border-default',
    strong: 'border-border-strong',
  };

  return (
    <hr
      className={cn('border-t my-6 w-full', variantClasses[variant], className)}
      {...props}
    />
  );
}

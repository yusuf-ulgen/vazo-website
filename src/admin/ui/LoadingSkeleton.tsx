import { cn } from '@/shared/lib/cn';

export interface LoadingSkeletonProps {
  count?: number;
  height?: string;
  width?: string;
  className?: string;
  rounded?: string;
}

export function LoadingSkeleton({
  count = 1,
  height = 'h-4',
  width = 'w-full',
  className,
  rounded = 'rounded-none',
}: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div className="space-y-2.5 w-full">
      {items.map((key) => (
        <div
          key={key}
          className={cn(
            'bg-surface-secondary/80 animate-pulse',
            height,
            width,
            rounded,
            className
          )}
        />
      ))}
    </div>
  );
}

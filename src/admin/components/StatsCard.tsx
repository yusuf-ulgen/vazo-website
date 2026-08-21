import { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  subtext?: string;
}

export function StatsCard({
  title,
  value,
  change,
  changeType = 'positive',
  icon: Icon,
  subtext,
}: StatsCardProps) {
  const changeColors = {
    positive: 'text-feedback-success bg-feedback-success-surface',
    negative: 'text-feedback-danger bg-feedback-danger-surface',
    neutral: 'text-text-secondary bg-surface-secondary',
  };

  return (
    <div className="bg-surface-primary border border-border-default p-5 shadow-subtle flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider font-semibold text-text-secondary">
          {title}
        </span>
        <div className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center text-text-primary">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <div className="font-display text-2xl sm:text-3xl text-text-primary font-normal">
          {value}
        </div>
        <div className="flex items-center gap-2 text-xs">
          {change && (
            <span className={cn('px-1.5 py-0.5 font-medium rounded', changeColors[changeType])}>
              {change}
            </span>
          )}
          {subtext && <span className="text-text-muted">{subtext}</span>}
        </div>
      </div>
    </div>
  );
}

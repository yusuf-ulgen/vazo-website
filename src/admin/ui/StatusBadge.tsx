import { cn } from '@/shared/lib/cn';

export type StatusBadgeType =
  | 'published'
  | 'draft'
  | 'archived'
  | 'active'
  | 'inactive'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'new'
  | 'read'
  | 'replied'
  | 'unsubscribed';

export interface StatusBadgeProps {
  status: StatusBadgeType | string;
  label?: string;
  showDot?: boolean;
  className?: string;
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string; border: string }> = {
  published: {
    label: 'Yayında',
    bg: 'bg-feedback-success-surface',
    text: 'text-feedback-success',
    dot: 'bg-feedback-success',
    border: 'border-feedback-success/30',
  },
  active: {
    label: 'Aktif',
    bg: 'bg-feedback-success-surface',
    text: 'text-feedback-success',
    dot: 'bg-feedback-success',
    border: 'border-feedback-success/30',
  },
  approved: {
    label: 'Onaylandı',
    bg: 'bg-feedback-success-surface',
    text: 'text-feedback-success',
    dot: 'bg-feedback-success',
    border: 'border-feedback-success/30',
  },
  draft: {
    label: 'Taslak',
    bg: 'bg-surface-secondary',
    text: 'text-text-secondary',
    dot: 'bg-text-muted',
    border: 'border-border-default',
  },
  inactive: {
    label: 'Pasif',
    bg: 'bg-surface-muted',
    text: 'text-text-muted',
    dot: 'bg-text-muted',
    border: 'border-border-subtle',
  },
  archived: {
    label: 'Arşivlendi',
    bg: 'bg-surface-muted',
    text: 'text-text-muted',
    dot: 'bg-text-muted',
    border: 'border-border-subtle',
  },
  pending: {
    label: 'Beklemede',
    bg: 'bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
    border: 'border-amber-500/30',
  },
  new: {
    label: 'Yeni',
    bg: 'bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-500',
    border: 'border-blue-500/30',
  },
  read: {
    label: 'Okundu',
    bg: 'bg-surface-secondary',
    text: 'text-text-secondary',
    dot: 'bg-text-muted',
    border: 'border-border-default',
  },
  replied: {
    label: 'Yanıtlandı',
    bg: 'bg-feedback-success-surface',
    text: 'text-feedback-success',
    dot: 'bg-feedback-success',
    border: 'border-feedback-success/30',
  },
  rejected: {
    label: 'Reddedildi',
    bg: 'bg-feedback-danger-surface',
    text: 'text-feedback-danger',
    dot: 'bg-feedback-danger',
    border: 'border-feedback-danger/30',
  },
  unsubscribed: {
    label: 'Ayrıldı',
    bg: 'bg-surface-muted',
    text: 'text-text-muted',
    dot: 'bg-text-muted',
    border: 'border-border-subtle',
  },
};

export function StatusBadge({
  status,
  label,
  showDot = true,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || {
    label: status,
    bg: 'bg-surface-secondary',
    text: 'text-text-secondary',
    dot: 'bg-text-muted',
    border: 'border-border-default',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium border rounded-full uppercase tracking-wider',
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />}
      <span>{label || config.label}</span>
    </span>
  );
}

import { Eyebrow } from './Eyebrow';
import { EditorialHeading } from './EditorialHeading';
import { cn } from '@/shared/lib/cn';

export interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  italicSubtitle?: string;
  description?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  italicSubtitle,
  description,
  align = 'left',
  className,
}: SectionHeaderProps) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center mx-auto',
    right: 'text-right ml-auto',
  };

  return (
    <div className={cn('max-w-2xl space-y-3 mb-10 md:mb-14', alignClasses[align], className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <EditorialHeading size="xl" italicSubtitle={italicSubtitle}>
        {title}
      </EditorialHeading>
      {description && (
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans font-normal">
          {description}
        </p>
      )}
    </div>
  );
}

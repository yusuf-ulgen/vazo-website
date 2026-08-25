import { Filter } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterDropdownProps {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function FilterDropdown({
  label,
  value,
  options,
  onChange,
  className,
  disabled = false,
}: FilterDropdownProps) {
  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <div className="absolute left-2.5 pointer-events-none text-text-muted">
        <Filter className="w-3.5 h-3.5" />
      </div>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="pl-8 pr-8 py-2 text-xs bg-surface-primary border border-border-default focus:border-text-primary focus:outline-none text-text-primary appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute right-2.5 pointer-events-none text-text-muted text-[10px]">
        ▼
      </div>
    </div>
  );
}

import { Search, X } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchField({
  value,
  onChange,
  placeholder = 'Ara...',
  className,
  disabled = false,
}: SearchFieldProps) {
  return (
    <div className={cn('relative flex items-center min-w-[200px]', className)}>
      <Search className="w-4 h-4 text-text-muted absolute left-3 pointer-events-none" />
      <input
        type="search"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full pl-9 pr-8 py-2 text-xs bg-surface-primary border border-border-default focus:border-text-primary focus:outline-none text-text-primary placeholder:text-text-muted transition-colors disabled:opacity-50"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Aramayı temizle"
          className="absolute right-2.5 p-1 text-text-muted hover:text-text-primary rounded-full transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

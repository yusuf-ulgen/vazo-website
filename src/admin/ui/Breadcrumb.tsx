import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-xs text-text-muted', className)}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        <li>
          <Link
            to="/admin"
            className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="sr-only">Admin Ana Sayfa</span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <React.Fragment key={index}>
              <li aria-hidden="true" className="text-text-muted">
                <ChevronRight className="w-3 h-3" />
              </li>
              <li>
                {item.href && !isLast ? (
                  <Link
                    to={item.href}
                    className="text-text-secondary hover:text-text-primary transition-colors font-medium"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? 'page' : undefined}
                    className={cn('font-semibold', isLast ? 'text-text-primary' : 'text-text-secondary')}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

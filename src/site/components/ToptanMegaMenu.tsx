import { Link } from 'react-router-dom';
import { ArrowRight, Building2 } from 'lucide-react';
import { toptanMegaMenuData } from '@/shared/mocks/navigation';

export interface ToptanMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ToptanMegaMenu({ isOpen, onClose }: ToptanMegaMenuProps) {
  if (!isOpen) return null;

  return (
    <div
      onMouseLeave={onClose}
      className="absolute top-full left-0 w-full bg-surface-primary border-b border-border-default shadow-dropdown z-40 animate-in fade-in slide-in-from-top-1 duration-200"
    >
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-12 gap-8">
        {/* Link Groups (8 columns) */}
        <div className="col-span-8 grid grid-cols-3 gap-8">
          {toptanMegaMenuData.groups.map((group) => (
            <div key={group.title} className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-editorial text-text-secondary border-b border-border-subtle pb-2">
                {group.title}
              </h3>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      onClick={onClose}
                      className="group flex items-center justify-between text-sm text-text-primary hover:text-neutral-600 transition-colors py-0.5"
                    >
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* B2B Application Promo Card (4 columns) */}
        <div className="col-span-4 bg-surface-muted border border-brand-stone/40 p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 bg-surface-inverse text-text-inverse flex items-center justify-center mb-2">
              <Building2 className="w-5 h-5" />
            </div>
            <p className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
              Kurumsal & B2B Portalı
            </p>
            <h4 className="font-display text-xl text-text-primary">
              {toptanMegaMenuData.promo.title}
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              {toptanMegaMenuData.promo.subtitle}
            </p>
          </div>

          <Link
            to={toptanMegaMenuData.promo.ctaHref}
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-wide bg-action-primary text-action-primary-text px-4 py-3 hover:bg-neutral-800 transition-colors mt-6"
          >
            <span>{toptanMegaMenuData.promo.ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

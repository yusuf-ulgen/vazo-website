import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, ShieldCheck } from 'lucide-react';
import { contentRepository } from '@/entities/content/api/content-repository';
import { MegaMenuData } from '@/shared/mocks/navigation';

export interface ToptanMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ToptanMegaMenu({ isOpen, onClose }: ToptanMegaMenuProps) {
  const [menuData, setMenuData] = useState<MegaMenuData | null>(null);

  useEffect(() => {
    contentRepository.getMegaMenu('wholesale_mega').then(setMenuData);
  }, []);

  if (!isOpen || !menuData) return null;

  return (
    <div
      onMouseEnter={() => {}}
      onMouseLeave={onClose}
      role="region"
      aria-label="Toptan Menüsü"
      className="absolute top-full left-0 w-full bg-surface-primary border-b border-border-default shadow-dropdown z-40 animate-fade-scale transition-all duration-300 origin-top"
    >
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-12 gap-8">
        {/* Link Groups (8 columns) */}
        <div className="col-span-8 grid grid-cols-3 gap-8">
          {menuData.groups.map((group) => (
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
                      className="group flex items-center justify-between text-sm text-text-primary hover:text-text-secondary transition-colors py-0.5"
                    >
                      <span className="group-hover:translate-x-1 transition-transform duration-200 font-normal">
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Toptan Application Promo Card (4 columns) */}
        <div className="col-span-4 bg-surface-muted border border-border-subtle p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 bg-surface-inverse text-text-inverse flex items-center justify-center mb-2">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5 text-xs uppercase font-semibold tracking-editorial text-text-secondary">
              <ShieldCheck className="w-3.5 h-3.5 text-feedback-success" />
              <span>Kurumsal & Toptan Portalı</span>
            </div>
            <h4 className="font-display text-xl text-text-primary">
              {menuData.promo.title}
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              {menuData.promo.subtitle}
            </p>
          </div>

          <Link
            to={menuData.promo.ctaHref}
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide bg-action-primary text-action-primary-text px-4 py-3 hover:bg-neutral-800 transition-colors mt-6"
          >
            <span>{menuData.promo.ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

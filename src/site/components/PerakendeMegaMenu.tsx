import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { contentRepository } from '@/entities/content/api/content-repository';
import { MegaMenuData } from '@/shared/mocks/navigation';

export interface PerakendeMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PerakendeMegaMenu({ isOpen, onClose }: PerakendeMegaMenuProps) {
  const [menuData, setMenuData] = useState<MegaMenuData | null>(null);

  useEffect(() => {
    contentRepository.getMegaMenu('retail_mega').then(setMenuData);
  }, []);

  if (!isOpen || !menuData) return null;

  return (
    <div
      onMouseEnter={() => {}}
      onMouseLeave={onClose}
      role="region"
      aria-label="Perakende Menüsü"
      className="absolute top-full left-0 w-full bg-surface-primary border-b border-border-default shadow-dropdown z-40 transition-opacity duration-200"
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
                      {link.isNew && (
                        <span className="flex items-center gap-1 text-[10px] uppercase font-semibold bg-surface-muted text-text-secondary px-1.5 py-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                          Yeni
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Editorial Promo Card (4 columns) */}
        <div className="col-span-4 bg-surface-secondary border border-border-subtle p-6 flex flex-col justify-between">
          <div className="space-y-3">
            {menuData.promo.imageUrl && (
              <div className="aspect-[4/3] w-full overflow-hidden bg-surface-muted mb-4">
                <img
                  src={menuData.promo.imageUrl}
                  alt={menuData.promo.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            )}
            <p className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
              Öne Çıkan Koleksiyon
            </p>
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
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-primary hover:opacity-75 transition-opacity pt-4 border-t border-border-subtle"
          >
            <span>{menuData.promo.ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

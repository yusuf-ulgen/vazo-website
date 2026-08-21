import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ChevronDown, ChevronRight, Building2, ShoppingBag, ShieldCheck } from 'lucide-react';
import { perakendeMegaMenuData, toptanMegaMenuData } from '@/shared/mocks/navigation';
import { siteConfig } from '@/shared/config/site-config';

export interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNavDrawer({ isOpen, onClose }: MobileNavDrawerProps) {
  const [retailExpanded, setRetailExpanded] = useState(false);
  const [wholesaleExpanded, setWholesaleExpanded] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-surface-primary shadow-elevated flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border-default">
            <span className="font-display text-xl tracking-wider text-text-primary">
              {siteConfig.name}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-text-secondary hover:text-text-primary"
              aria-label="Menüyü Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-5 space-y-1">
            <Link
              to="/products?filter=new"
              onClick={onClose}
              className="flex items-center justify-between py-3 text-sm font-medium border-b border-border-subtle"
            >
              <span>Yeni Gelenler</span>
              <ChevronRight className="w-4 h-4 text-text-muted" />
            </Link>

            {/* Perakende Accordion */}
            <div>
              <button
                onClick={() => setRetailExpanded((p) => !p)}
                className="w-full flex items-center justify-between py-3 text-sm font-medium border-b border-border-subtle"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Perakende Koleksiyonu</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    retailExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {retailExpanded && (
                <div className="bg-surface-secondary px-4 py-2 space-y-2 text-xs">
                  {perakendeMegaMenuData.groups.flatMap((g) => g.links).map((link) => (
                    <Link
                      key={link.label}
                      to={link.href}
                      onClick={onClose}
                      className="block py-1 text-text-secondary hover:text-text-primary"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Toptan Accordion */}
            <div>
              <button
                onClick={() => setWholesaleExpanded((p) => !p)}
                className="w-full flex items-center justify-between py-3 text-sm font-medium border-b border-border-subtle"
              >
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>Toptan & B2B Portalı</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    wholesaleExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {wholesaleExpanded && (
                <div className="bg-surface-muted px-4 py-2 space-y-2 text-xs">
                  {toptanMegaMenuData.groups.flatMap((g) => g.links).map((link) => (
                    <Link
                      key={link.label}
                      to={link.href}
                      onClick={onClose}
                      className="block py-1 text-text-secondary hover:text-text-primary"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/about"
              onClick={onClose}
              className="flex items-center justify-between py-3 text-sm font-medium border-b border-border-subtle"
            >
              <span>Hakkımızda</span>
              <ChevronRight className="w-4 h-4 text-text-muted" />
            </Link>

            <Link
              to="/contact"
              onClick={onClose}
              className="flex items-center justify-between py-3 text-sm font-medium border-b border-border-subtle"
            >
              <span>İletişim & Stüdyo</span>
              <ChevronRight className="w-4 h-4 text-text-muted" />
            </Link>
          </nav>
        </div>

        {/* Footer Admin Link & Quick Info */}
        <div className="p-5 border-t border-border-default bg-surface-secondary space-y-3">
          <Link
            to="/admin"
            onClick={onClose}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-text-primary"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Yönetici Paneli (Admin)</span>
          </Link>
          <p className="text-[11px] text-text-muted">
            © {new Date().getFullYear()} {siteConfig.name}. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </div>
  );
}

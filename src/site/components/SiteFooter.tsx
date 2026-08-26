import { Link } from 'react-router-dom';
import { Instagram, Facebook, Mail } from 'lucide-react';
import { usePolicyDrawer } from '@/shared/stores/policy-drawer-store';
import { useSiteSettings } from '@/shared/stores/settings-store';

export function SiteFooter() {
  const { open: openPolicy } = usePolicyDrawer();
  const { settings } = useSiteSettings();

  return (
    <footer className="bg-canvas-warm border-t border-border-default pt-10 pb-8 text-xs font-sans text-text-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Grid: 5 cols brand, 2 cols shop, 2 cols wholesale, 3 cols support */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-10 border-b border-border-subtle text-left">
          {/* Brand Info (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <Link
              to="/"
              className="font-display text-2xl md:text-3xl tracking-widest uppercase text-text-primary block"
            >
              {settings.general.brandName}
            </Link>
            <p className="text-xs max-w-sm leading-relaxed text-text-secondary font-normal">
              {settings.general.description}
            </p>
            <div className="pt-1 text-xs space-y-1 text-text-secondary">
              <p>📍 {settings.contact.address}</p>
              <p>📞 {settings.contact.phone}</p>
              <p>✉️ {settings.contact.email}</p>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2.5 pt-1">
              {settings.social.instagram && (
                <a
                  href={settings.social.instagram}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Instagram"
                  className="w-7 h-7 rounded-full bg-surface-primary border border-border-default flex items-center justify-center text-text-primary hover:text-text-secondary transition-colors"
                >
                  <Instagram className="w-3.5 h-3.5" />
                </a>
              )}
              {settings.social.facebook && (
                <a
                  href={settings.social.facebook}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Facebook"
                  className="w-7 h-7 rounded-full bg-surface-primary border border-border-default flex items-center justify-center text-text-primary hover:text-text-secondary transition-colors"
                >
                  <Facebook className="w-3.5 h-3.5" />
                </a>
              )}
              {settings.contact.email && (
                <a
                  href={`mailto:${settings.contact.email}`}
                  aria-label="E-Posta"
                  className="w-7 h-7 rounded-full bg-surface-primary border border-border-default flex items-center justify-center text-text-primary hover:text-text-secondary transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Shop Column (2 cols) - 4 links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-editorial text-text-primary">
              Alışveriş
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="hover:text-text-primary transition-colors">
                  Tüm Modeller
                </Link>
              </li>
              <li>
                <Link to="/new" className="hover:text-text-primary transition-colors">
                  Yeni Gelenler
                </Link>
              </li>
              <li>
                <Link to="/bestsellers" className="hover:text-text-primary transition-colors">
                  Çok Satanlar
                </Link>
              </li>
              <li>
                <Link to="/collections" className="hover:text-text-primary transition-colors">
                  Koleksiyonlar
                </Link>
              </li>
            </ul>
          </div>

          {/* Wholesale Column (2 cols) - 4 links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-editorial text-text-primary">
              Toptan
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/wholesale" className="hover:text-text-primary transition-colors">
                  Toptan Satışımız
                </Link>
              </li>
              <li>
                <Link to="/wholesale/products" className="hover:text-text-primary transition-colors">
                  Toptan Kataloğu
                </Link>
              </li>
              <li>
                <Link to="/wholesale/how-it-works" className="hover:text-text-primary transition-colors">
                  Nasıl Çalışır?
                </Link>
              </li>
              <li>
                <Link to="/wholesale/apply" className="hover:text-text-primary transition-colors">
                  Ticari Hesap Başvurusu
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column (3 cols) - 4 links */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-editorial text-text-primary">
              Müşteri Deneyimi
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="hover:text-text-primary transition-colors">
                  Hakkımızda & Zanaat
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-text-primary transition-colors">
                  İletişim & Showroom
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-text-primary transition-colors">
                  Sıkça Sorulan Sorular
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => openPolicy('shipping')}
                  className="hover:text-text-primary transition-colors text-left"
                >
                  Kargo & İade Koşulları
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <p>© {new Date().getFullYear()} {settings.general.brandName}. Tüm hakları saklıdır.</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => openPolicy('privacy')}
              className="hover:text-text-primary transition-colors"
            >
              Gizlilik & KVKK
            </button>
            <button
              type="button"
              onClick={() => openPolicy('terms')}
              className="hover:text-text-primary transition-colors"
            >
              Kullanım Koşulları
            </button>
            <button
              type="button"
              onClick={() => openPolicy('shipping')}
              className="hover:text-text-primary transition-colors"
            >
              Teslimat & İade
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

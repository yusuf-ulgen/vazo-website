import { Link } from 'react-router-dom';
import { Instagram, Facebook, Mail } from 'lucide-react';
import { usePolicyDrawer } from '@/shared/stores/policy-drawer-store';
import { useSiteSettings } from '@/shared/stores/settings-store';

export function SiteFooter() {
  const { open: openPolicy } = usePolicyDrawer();
  const { settings } = useSiteSettings();

  return (
    <footer className="bg-canvas-warm border-t border-border-subtle pt-12 sm:pt-16 pb-10 sm:pb-12 text-xs font-sans text-text-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Grid: Brand (4 cols) & Nav Columns (8 cols: 3 equal sub-columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-16 pb-12 sm:pb-14 border-b border-border-subtle/70 items-start text-left">
          {/* Brand Info (Col 1 - 4 cols) */}
          <div className="lg:col-span-4 space-y-4 flex flex-col items-center text-center">
            <Link to="/" aria-label={settings.general.brandName} className="inline-flex justify-center">
              <img
                src="/images/MONOCACTUS.png"
                alt={settings.general.brandName}
                className="h-24 sm:h-28 w-auto object-contain"
              />
            </Link>
            <p className="text-xs max-w-xs leading-relaxed text-text-secondary font-normal text-center">
              {settings.general.description}
            </p>
            <div className="pt-1 text-xs space-y-1.5 text-text-secondary text-center">
              <p>📍 {settings.contact.address}</p>
              <p>📞 {settings.contact.phone}</p>
              <p>✉️ {settings.contact.email}</p>
            </div>

            {/* Social Links */}
            <div className="flex items-center justify-center gap-3 pt-2">
              {settings.social.instagram && (
                <a
                  href={settings.social.instagram}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Instagram"
                  className="w-8 h-8 rounded-full bg-surface-primary border border-border-default flex items-center justify-center text-text-primary hover:text-text-secondary transition-colors shadow-2xs"
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
                  className="w-8 h-8 rounded-full bg-surface-primary border border-border-default flex items-center justify-center text-text-primary hover:text-text-secondary transition-colors shadow-2xs"
                >
                  <Facebook className="w-3.5 h-3.5" />
                </a>
              )}
              {settings.contact.email && (
                <a
                  href={`mailto:${settings.contact.email}`}
                  aria-label="E-Posta"
                  className="w-8 h-8 rounded-full bg-surface-primary border border-border-default flex items-center justify-center text-text-primary hover:text-text-secondary transition-colors shadow-2xs"
                >
                  <Mail className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Right Navigation Columns (8 cols: 3 equal sub-columns) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12 pt-2 sm:pt-4 lg:pt-6">
            {/* Shop Column */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-text-primary">
                Alışveriş
              </h4>
              <ul className="space-y-3.5">
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

            {/* Wholesale Column */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-text-primary">
                Toptan
              </h4>
              <ul className="space-y-3.5">
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

            {/* Support Column */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-text-primary">
                Müşteri Deneyimi
              </h4>
              <ul className="space-y-3.5">
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
                <li>
                  <Link to="/seller-information" className="hover:text-text-primary transition-colors">
                    Satıcı & Yasal Bilgiler
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-left sm:text-center">
            <p>© {new Date().getFullYear()} {settings.general.brandName}. Tüm hakları saklıdır.</p>
            <span className="hidden sm:inline text-border-default">•</span>
            <span className="text-[11px] text-text-secondary">
              Ödemeler PayTR 256-bit SSL güvencesiyle işlenir. Kart bilgileri saklanmaz.
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link to="/seller-information" className="hover:text-text-primary transition-colors font-medium">
              Satıcı Bilgileri
            </Link>
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

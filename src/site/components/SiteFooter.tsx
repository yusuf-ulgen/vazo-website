import { Link } from 'react-router-dom';
import { Instagram, Facebook, Mail } from 'lucide-react';
import { usePolicyDrawer } from '@/shared/stores/policy-drawer-store';
import { useSiteSettings } from '@/shared/stores/settings-store';

export function SiteFooter() {
  const { open: openPolicy } = usePolicyDrawer();
  const { settings } = useSiteSettings();

  return (
    <footer className="bg-canvas-warm border-t border-border-default pt-6 sm:pt-7 pb-8 text-xs font-sans text-text-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Grid: 4 symmetrical columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pb-8 border-b border-border-subtle items-start text-left">
          {/* Brand Info (Col 1) */}
          <div className="space-y-3 flex flex-col items-center text-center">
            <Link to="/" aria-label={settings.general.brandName} className="inline-flex justify-center">
              <img
                src="/images/MONOCACTUS.png"
                alt={settings.general.brandName}
                className="h-20 sm:h-24 w-auto object-contain"
              />
            </Link>
            <p className="text-xs max-w-xs leading-relaxed text-text-secondary font-normal text-center">
              {settings.general.description}
            </p>
            <div className="pt-1 text-xs space-y-1 text-text-secondary text-center">
              <p>📍 {settings.contact.address}</p>
              <p>📞 {settings.contact.phone}</p>
              <p>✉️ {settings.contact.email}</p>
            </div>

            {/* Social Links */}
            <div className="flex items-center justify-center gap-2.5 pt-1">
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

          {/* Shop Column (Col 2) */}
          <div className="space-y-3 sm:pl-4 lg:pl-6">
            <h4 className="text-xs font-semibold uppercase tracking-editorial text-text-primary">
              Alışveriş
            </h4>
            <ul className="space-y-2.5">
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

          {/* Wholesale Column (Col 3) */}
          <div className="space-y-3 sm:pl-4 lg:pl-6">
            <h4 className="text-xs font-semibold uppercase tracking-editorial text-text-primary">
              Toptan
            </h4>
            <ul className="space-y-2.5">
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

          {/* Support Column (Col 4) */}
          <div className="space-y-3 sm:pl-4 lg:pl-6">
            <h4 className="text-xs font-semibold uppercase tracking-editorial text-text-primary">
              Müşteri Deneyimi
            </h4>
            <ul className="space-y-2.5">
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

        {/* Bottom Legal Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
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

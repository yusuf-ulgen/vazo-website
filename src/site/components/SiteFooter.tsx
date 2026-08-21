import { Link } from 'react-router-dom';
import { ArrowRight, Shield } from 'lucide-react';
import { siteConfig } from '@/shared/config/site-config';

export function SiteFooter() {
  return (
    <footer className="bg-surface-primary border-t border-border-default pt-16 pb-12 text-sm text-text-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-16 border-b border-border-subtle">
          {/* Brand Col (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <span className="font-display text-2xl tracking-widest uppercase text-text-primary">
              {siteConfig.name}
            </span>
            <p className="text-xs max-w-sm leading-relaxed text-text-secondary">
              {siteConfig.description}
            </p>
            <div className="pt-2 text-xs space-y-1 text-text-secondary">
              <p>📍 {siteConfig.contact.address}</p>
              <p>✉️ {siteConfig.contact.email} | 📞 {siteConfig.contact.phone}</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-editorial text-text-primary">
              Perakende
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/products" className="hover:text-text-primary transition-colors">
                  Tüm Vazolar
                </Link>
              </li>
              <li>
                <Link to="/products?filter=new" className="hover:text-text-primary transition-colors">
                  Yeni Gelenler
                </Link>
              </li>
              <li>
                <Link to="/collections" className="hover:text-text-primary transition-colors">
                  Koleksiyonlar
                </Link>
              </li>
              <li>
                <Link to="/care-guide" className="hover:text-text-primary transition-colors">
                  Seramik Bakım Rehberi
                </Link>
              </li>
            </ul>
          </div>

          {/* Wholesale Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-editorial text-text-primary">
              Toptan & B2B
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/wholesale" className="hover:text-text-primary transition-colors">
                  B2B Satış Koşulları
                </Link>
              </li>
              <li>
                <Link to="/wholesale/apply" className="hover:text-text-primary transition-colors">
                  Trade / Bayilik Başvurusu
                </Link>
              </li>
              <li>
                <Link to="/wholesale/architects" className="hover:text-text-primary transition-colors">
                  Mimari Projeler
                </Link>
              </li>
              <li>
                <Link to="/wholesale/catalog" className="hover:text-text-primary transition-colors">
                  PDF Katalog İndir
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-editorial text-text-primary">
              Bültene Katılın
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Yeni koleksiyon lansmanları ve seramik stüdyosu güncellemelerinden haberdar olun.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
              <div className="flex border border-border-default focus-within:border-text-primary">
                <input
                  type="email"
                  placeholder="E-posta adresiniz"
                  aria-label="E-posta adresi"
                  className="w-full px-3 py-2 text-xs bg-transparent focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Gönder"
                  className="px-3 bg-action-primary text-action-primary-text hover:bg-neutral-800 transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <p>© {new Date().getFullYear()} {siteConfig.name}. Tüm hakları saklıdır.</p>
          <div className="flex items-center space-x-6">
            <Link to="/privacy" className="hover:text-text-primary transition-colors">
              Gizlilik Politikası
            </Link>
            <Link to="/terms" className="hover:text-text-primary transition-colors">
              Kullanım Koşulları
            </Link>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Yönetici Paneli</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

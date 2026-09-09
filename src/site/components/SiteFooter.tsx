import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Mail } from 'lucide-react';
import { usePolicyDrawer } from '@/shared/stores/policy-drawer-store';
import { useSiteSettings } from '@/shared/stores/settings-store';
import { contentRepository } from '@/entities/content/api/content-repository';
import { mockFooterNavGroups } from '@/entities/content/api/content-mocks';
import type { MenuGroup } from '@/entities/content/types';

export function SiteFooter() {
  const { open: openPolicy } = usePolicyDrawer();
  const { settings } = useSiteSettings();
  const [footerGroups, setFooterGroups] = useState<MenuGroup[]>(mockFooterNavGroups);

  useEffect(() => {
    let isMounted = true;
    contentRepository.getNavMenu('footer')
      .then((groups) => {
        if (isMounted && groups && groups.length > 0) {
          setFooterGroups(groups);
        }
      })
      .catch((err) => {
        console.warn('[SiteFooter] Failed to load dynamic footer nav:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer className="bg-canvas-warm border-t border-border-subtle pt-6 sm:pt-8 pb-10 sm:pb-12 text-xs font-sans text-text-secondary">
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
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.contact.address)}`}
                target="_blank"
                rel="noreferrer noopener"
                className="block hover:text-text-primary transition-colors cursor-pointer"
                title="Google Haritalar'da Aç"
              >
                📍 {settings.contact.address}
              </a>
              <a
                href={`tel:${settings.contact.phone.replace(/\s+/g, '')}`}
                className="block hover:text-text-primary transition-colors cursor-pointer"
                title="Telefon ile Ara"
              >
                📞 {settings.contact.phone}
              </a>
              <a
                href={`mailto:${settings.contact.email}`}
                className="block hover:text-text-primary transition-colors cursor-pointer"
                title="E-Posta Gönder"
              >
                ✉️ {settings.contact.email}
              </a>
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

          {/* Dynamic Navigation Columns */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 lg:gap-12 pt-6 sm:pt-10 lg:pt-14">
            {footerGroups.map((group) => {
              const activeItems = (group.items || []).filter((item) => item.active);
              if (activeItems.length === 0 && !group.title) return null;
              return (
                <div key={group.id} className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-text-primary">
                    {group.title}
                  </h4>
                  <ul className="space-y-3.5">
                    {activeItems.map((item) => {
                      if (item.href.startsWith('#policy-')) {
                        const policyKey = item.href.replace('#policy-', '') as 'privacy' | 'terms' | 'shipping';
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => openPolicy(policyKey)}
                              className="hover:text-text-primary transition-colors text-left cursor-pointer"
                            >
                              {item.label}
                            </button>
                          </li>
                        );
                      }

                      if (item.href.startsWith('http')) {
                        return (
                          <li key={item.id}>
                            <a
                              href={item.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-text-primary transition-colors cursor-pointer"
                            >
                              {item.label}
                            </a>
                          </li>
                        );
                      }

                      return (
                        <li key={item.id}>
                          <Link to={item.href} className="hover:text-text-primary transition-colors">
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
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

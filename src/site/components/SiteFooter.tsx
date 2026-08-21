import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, CheckCircle2, Instagram, Facebook, Mail, RefreshCcw } from 'lucide-react';
import { siteConfig } from '@/shared/config/site-config';
import { contentRepository } from '@/entities/content/api/content-repository';

export function SiteFooter() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await contentRepository.subscribeNewsletter({ email, source: 'footer' });
      setIsSubscribed(true);
      setEmail('');
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Bülten kaydı oluşturulamadı.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-canvas-warm border-t border-border-default pt-16 pb-12 text-xs font-sans text-text-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-16 border-b border-border-subtle text-left">
          {/* Brand Info (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Link
              to="/"
              className="font-display text-2xl md:text-3xl tracking-widest uppercase text-text-primary block"
            >
              {siteConfig.name}
            </Link>
            <p className="text-xs max-w-sm leading-relaxed text-text-secondary font-normal">
              {siteConfig.description}
            </p>
            <div className="pt-2 text-xs space-y-1.5 text-text-secondary">
              <p className="text-text-primary font-medium">📍 Showroom & Atölye:</p>
              <p>{siteConfig.contact.address}</p>
              <p>📞 {siteConfig.contact.phone} • ✉️ {siteConfig.contact.email}</p>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Instagram"
                className="w-8 h-8 rounded-full bg-surface-primary border border-border-default flex items-center justify-center text-text-primary hover:text-text-secondary transition-colors"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Facebook"
                className="w-8 h-8 rounded-full bg-surface-primary border border-border-default flex items-center justify-center text-text-primary hover:text-text-secondary transition-colors"
              >
                <Facebook className="w-3.5 h-3.5" />
              </a>
              <a
                href={`mailto:${siteConfig.contact.email}`}
                aria-label="E-Posta"
                className="w-8 h-8 rounded-full bg-surface-primary border border-border-default flex items-center justify-center text-text-primary hover:text-text-secondary transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Shop Column (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-editorial text-text-primary">
              Alışveriş & Koleksiyon
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
              <li>
                <Link to="/wishlist" className="hover:text-text-primary transition-colors">
                  Favorilerim
                </Link>
              </li>
            </ul>
          </div>

          {/* Wholesale Column (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-editorial text-text-primary">
              Toptan & B2B
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/wholesale" className="hover:text-text-primary transition-colors">
                  Toptan Satışımız
                </Link>
              </li>
              <li>
                <Link to="/wholesale/products" className="hover:text-text-primary transition-colors">
                  B2B Kataloğu
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

          {/* Support & Newsletter Column (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-editorial text-text-primary">
              Müşteri Deneyimi & Bülten
            </h4>
            <ul className="space-y-1.5 pb-2">
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
                <Link to="/policies/shipping-returns" className="hover:text-text-primary transition-colors">
                  Kargo & İade Koşulları
                </Link>
              </li>
            </ul>

            {/* Newsletter input */}
            <div className="pt-1">
              {isSubscribed ? (
                <div className="inline-flex items-center gap-1.5 text-[11px] text-feedback-success font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Bülten kaydınız tamamlandı.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-1.5">
                  <p className="text-[11px] text-text-secondary">
                    Yeni koleksiyon ve stüdyo duyuruları:
                  </p>
                  <div className="flex border border-border-default focus-within:border-text-primary bg-surface-primary">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="E-posta adresiniz..."
                      aria-label="E-posta adresi"
                      className="w-full px-3 py-2 text-xs bg-transparent focus:outline-none text-text-primary"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      aria-label="Abone Ol"
                      className="px-3 bg-action-primary text-action-primary-text hover:bg-neutral-800 transition-colors disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  {errorMessage && (
                    <p className="text-[10px] text-feedback-danger">{errorMessage}</p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <p>© {new Date().getFullYear()} {siteConfig.name}. Tüm hakları saklıdır.</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link to="/policies/privacy-kvkk" className="hover:text-text-primary transition-colors">
              Gizlilik & KVKK
            </Link>
            <Link to="/policies/terms" className="hover:text-text-primary transition-colors">
              Kullanım Koşulları
            </Link>
            <Link to="/policies/shipping-returns" className="hover:text-text-primary transition-colors">
              Teslimat & İade
            </Link>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              <Shield className="w-3 h-3" />
              <span>Yönetici Paneli</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

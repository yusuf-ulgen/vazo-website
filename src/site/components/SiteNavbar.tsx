import { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Menu,
  Search,
  User,
  Heart,
  ShoppingBag,
  ChevronDown,
} from 'lucide-react';
import { useWishlist } from '@/shared/stores/wishlist-store';
import { useCart } from '@/shared/stores/cart-store';
import { useCustomerAuth } from '@/shared/stores/customer-auth-store';
import { useSiteSettings } from '@/shared/stores/settings-store';
import { PerakendeMegaMenu } from './PerakendeMegaMenu';
import { ToptanMegaMenu } from './ToptanMegaMenu';
import { MobileNavDrawer } from './MobileNavDrawer';
import { CartDrawer } from './CartDrawer';
import { SearchModal } from './SearchModal';
import { AuthModal } from './AuthModal';
import { contentRepository } from '@/entities/content/api/content-repository';
import type { MenuItem } from '@/entities/content/types';

const DEFAULT_PRIMARY_NAV: MenuItem[] = [
  { id: 'p1', groupId: 'primary', label: 'Yeni', href: '/new', isNew: false, isPopular: false, sortOrder: 1, active: true },
  { id: 'p2', groupId: 'primary', label: 'Perakende', href: '/products', isNew: false, isPopular: false, sortOrder: 2, active: true },
  { id: 'p3', groupId: 'primary', label: 'Toptan', href: '/wholesale', isNew: false, isPopular: false, sortOrder: 3, active: true },
  { id: 'p4', groupId: 'primary', label: 'Koleksiyonlar', href: '/collections', isNew: false, isPopular: false, sortOrder: 4, active: true },
  { id: 'p5', groupId: 'primary', label: 'Hakkımızda', href: '/about', isNew: false, isPopular: false, sortOrder: 5, active: true },
  { id: 'p6', groupId: 'primary', label: 'İletişim', href: '/contact', isNew: false, isPopular: false, sortOrder: 6, active: true },
];

export function SiteNavbar() {
  const [activeMenu, setActiveMenu] = useState<'perakende' | 'toptan' | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const { count: wishlistCount } = useWishlist();
  const { totalItems: cartCount } = useCart();
  const { user, displayName, isAuthenticated } = useCustomerAuth();
  const { settings } = useSiteSettings();
  const [navItems, setNavItems] = useState<MenuItem[]>(DEFAULT_PRIMARY_NAV);

  useEffect(() => {
    if (searchParams.get('auth_required') === 'true') {
      setAuthModalOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('auth_required');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    let isMounted = true;
    contentRepository.getNavMenu('primary')
      .then((groups) => {
        if (!isMounted || !groups || groups.length === 0) return;
        const items = groups.flatMap((g) => g.items || []).filter((i) => i.active);
        if (items.length > 0) {
          setNavItems(items);
        }
      })
      .catch((err) => {
        console.warn('[SiteNavbar] Failed to load dynamic primary nav:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleMouseEnter = (menu: 'perakende' | 'toptan') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveMenu(menu);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 150);
  };

  const handleCloseImmediate = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveMenu(null);
  };

  // Keyboard shortcut CMD+K or / for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header
        className="sticky top-0 z-40 bg-surface-primary/95 backdrop-blur-md border-b border-border-subtle transition-all duration-200"
        onMouseLeave={handleMouseLeave}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Mobile Menu Button */}
            <div className="flex items-center lg:hidden">
              <button
                onClick={() => setMobileDrawerOpen(true)}
                aria-label="Menüyü Aç"
                className="p-2 text-text-primary hover:text-text-secondary transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            {/* Brand Logo */}
            <div className="flex items-center" onMouseEnter={handleCloseImmediate}>
              <Link
                to="/"
                aria-label={settings.general.brandName}
                className="flex items-center group"
              >
                <img
                  src="/images/MONOCACTUS.png"
                  alt={settings.general.brandName}
                  className="h-11 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8 text-sm font-sans tracking-wide">
              {navItems.map((item) => {
                const lower = item.label.toLowerCase();
                const isPerakende = item.href === '/products' || lower.includes('perakende');
                const isToptan = item.href === '/wholesale' || lower.includes('toptan');

                if (isPerakende) {
                  return (
                    <div
                      key={item.id}
                      className="relative py-2"
                      onMouseEnter={() => handleMouseEnter('perakende')}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveMenu(activeMenu === 'perakende' ? null : 'perakende')}
                        aria-expanded={activeMenu === 'perakende'}
                        className={`inline-flex items-center gap-1.5 hover:opacity-60 transition-opacity ${
                          activeMenu === 'perakende' ? 'text-text-primary font-semibold' : 'text-text-primary'
                        }`}
                      >
                        <span>{item.label}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-text-secondary transition-transform duration-200 ${
                            activeMenu === 'perakende' ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>
                  );
                }

                if (isToptan) {
                  return (
                    <div
                      key={item.id}
                      className="relative py-2"
                      onMouseEnter={() => handleMouseEnter('toptan')}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveMenu(activeMenu === 'toptan' ? null : 'toptan')}
                        aria-expanded={activeMenu === 'toptan'}
                        className={`inline-flex items-center gap-1.5 hover:opacity-60 transition-opacity ${
                          activeMenu === 'toptan' ? 'text-text-primary font-semibold' : 'text-text-primary'
                        }`}
                      >
                        <span>{item.label}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-text-secondary transition-transform duration-200 ${
                            activeMenu === 'toptan' ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>
                  );
                }

                if (item.href.startsWith('http')) {
                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onMouseEnter={handleCloseImmediate}
                      className="text-text-primary hover:opacity-60 transition-opacity py-2 font-normal"
                    >
                      {item.label}
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    to={item.href}
                    onMouseEnter={handleCloseImmediate}
                    className="text-text-primary hover:opacity-60 transition-opacity py-2 font-normal"
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Action Icons */}
            <div
              className="flex items-center space-x-2 sm:space-x-4 text-text-primary"
              onMouseEnter={handleCloseImmediate}
            >
              {/* Search Trigger */}
              <button
                onClick={() => setSearchModalOpen(true)}
                aria-label="Ürün Ara (CMD+K)"
                title="Ürün Ara (CMD+K)"
                className="p-2 text-text-primary hover:text-text-secondary transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Account / Login Trigger */}
              <button
                onClick={() => setAuthModalOpen(true)}
                aria-label={isAuthenticated ? 'Hesabım' : 'Giriş Yap'}
                title={isAuthenticated ? `${displayName} (${user?.email})` : 'Giriş Yap / Hesap'}
                className="p-2 text-text-primary hover:text-text-secondary transition-colors relative hidden sm:inline-flex items-center"
              >
                {isAuthenticated ? (
                  <div className="relative">
                    <User className="w-5 h-5 text-text-primary" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-feedback-success border-2 border-surface-primary rounded-full" />
                  </div>
                ) : (
                  <User className="w-5 h-5" />
                )}
              </button>

              {/* Wishlist Trigger with Badge */}
              <Link
                to="/wishlist"
                aria-label="Favoriler"
                className="p-2 text-text-primary hover:text-text-secondary transition-colors relative hidden sm:inline-block"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 bg-surface-inverse text-text-inverse text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-sans font-bold shadow-xs">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart Drawer Trigger */}
              <button
                onClick={() => setCartDrawerOpen(true)}
                aria-label="Alışveriş Sepeti"
                className="p-2 text-text-primary hover:text-text-secondary transition-colors relative"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 bg-surface-inverse text-text-inverse text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-sans font-bold shadow-xs">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Mega Menus */}
        <PerakendeMegaMenu
          isOpen={activeMenu === 'perakende'}
          onClose={() => setActiveMenu(null)}
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
        />
        <ToptanMegaMenu
          isOpen={activeMenu === 'toptan'}
          onClose={() => setActiveMenu(null)}
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
        />
      </header>

      {/* Slide-over Drawers & Modals */}
      <MobileNavDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        onOpenSearch={() => setSearchModalOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
      />
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
      />
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}

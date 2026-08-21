import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  Search,
  User,
  Heart,
  ShoppingBag,
  ChevronDown,
  Shield,
} from 'lucide-react';
import { siteConfig } from '@/shared/config/site-config';
import { useWishlist } from '@/shared/stores/wishlist-store';
import { useCart } from '@/shared/stores/cart-store';
import { PerakendeMegaMenu } from './PerakendeMegaMenu';
import { ToptanMegaMenu } from './ToptanMegaMenu';
import { MobileNavDrawer } from './MobileNavDrawer';
import { CartDrawer } from './CartDrawer';
import { SearchModal } from './SearchModal';

export function SiteNavbar() {
  const [activeMenu, setActiveMenu] = useState<'perakende' | 'toptan' | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { count: wishlistCount } = useWishlist();
  const { totalItems: cartCount } = useCart();

  const handleMouseEnter = (menu: 'perakende' | 'toptan') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveMenu(menu);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 150);
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
            <div className="flex items-center">
              <Link
                to="/"
                className="font-display text-2xl md:text-3xl tracking-widest uppercase font-normal text-text-primary"
              >
                {siteConfig.name}
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8 text-sm font-sans tracking-wide">
              <Link
                to="/new"
                className="text-text-primary hover:opacity-60 transition-opacity py-2 font-normal"
              >
                Yeni
              </Link>

              {/* Perakende Mega Menu Trigger */}
              <div
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
                  <span>Perakende</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-text-secondary transition-transform duration-200 ${
                      activeMenu === 'perakende' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Toptan Mega Menu Trigger */}
              <div
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
                  <span>Toptan</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-text-secondary transition-transform duration-200 ${
                      activeMenu === 'toptan' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>

              <Link
                to="/collections"
                className="text-text-primary hover:opacity-60 transition-opacity py-2"
              >
                Koleksiyonlar
              </Link>

              <Link
                to="/about"
                className="text-text-primary hover:opacity-60 transition-opacity py-2"
              >
                Hakkımızda
              </Link>

              <Link
                to="/contact"
                className="text-text-primary hover:opacity-60 transition-opacity py-2"
              >
                İletişim
              </Link>
            </nav>

            {/* Action Icons */}
            <div className="flex items-center space-x-2 sm:space-x-4 text-text-primary">
              {/* Direct Admin Link */}
              <Link
                to="/admin"
                title="Yönetici Paneli (Admin)"
                aria-label="Admin Paneli"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider bg-surface-muted text-text-secondary px-2.5 py-1 hover:bg-neutral-200 transition-colors"
              >
                <Shield className="w-3 h-3" />
                <span>Admin</span>
              </Link>

              {/* Search Trigger */}
              <button
                onClick={() => setSearchModalOpen(true)}
                aria-label="Ürün Ara (CMD+K)"
                title="Ürün Ara (CMD+K)"
                className="p-2 text-text-primary hover:text-text-secondary transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Account Trigger */}
              <Link
                to="/contact"
                aria-label="Kullanıcı Hesabı"
                className="p-2 text-text-primary hover:text-text-secondary transition-colors hidden sm:inline-block"
              >
                <User className="w-5 h-5" />
              </Link>

              {/* Wishlist Trigger with Badge */}
              <Link
                to="/products?filter=wishlist"
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
        />
        <ToptanMegaMenu
          isOpen={activeMenu === 'toptan'}
          onClose={() => setActiveMenu(null)}
        />
      </header>

      {/* Slide-over Drawers & Modals */}
      <MobileNavDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        onOpenSearch={() => setSearchModalOpen(true)}
      />
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
      />
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </>
  );
}

import { useState } from 'react';
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
import { PerakendeMegaMenu } from './PerakendeMegaMenu';
import { ToptanMegaMenu } from './ToptanMegaMenu';
import { MobileNavDrawer } from './MobileNavDrawer';

export function SiteNavbar() {
  const [activeMenu, setActiveMenu] = useState<'perakende' | 'toptan' | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-surface-primary/95 backdrop-blur-md border-b border-border-subtle transition-all">
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
              to="/products?filter=new"
              className="text-text-primary hover:opacity-60 transition-opacity py-2 font-normal"
            >
              Yeni
            </Link>

            {/* Perakende Mega Menu Trigger */}
            <div
              className="relative"
              onMouseEnter={() => setActiveMenu('perakende')}
            >
              <button
                type="button"
                className={`inline-flex items-center gap-1.5 py-2 hover:opacity-60 transition-opacity ${
                  activeMenu === 'perakende' ? 'text-text-primary font-semibold' : 'text-text-primary'
                }`}
              >
                <span>Perakende</span>
                <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />
              </button>
            </div>

            {/* Toptan Mega Menu Trigger */}
            <div
              className="relative"
              onMouseEnter={() => setActiveMenu('toptan')}
            >
              <button
                type="button"
                className={`inline-flex items-center gap-1.5 py-2 hover:opacity-60 transition-opacity ${
                  activeMenu === 'toptan' ? 'text-text-primary font-semibold' : 'text-text-primary'
                }`}
              >
                <span>Toptan</span>
                <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />
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
          <div className="flex items-center space-x-3 sm:space-x-5 text-text-primary">
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

            <button
              aria-label="Ürün Ara"
              className="p-1.5 hover:opacity-60 transition-opacity"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              aria-label="Kullanıcı Hesabı"
              className="p-1.5 hover:opacity-60 transition-opacity hidden sm:inline-block"
            >
              <User className="w-5 h-5" />
            </button>

            <button
              aria-label="Favoriler"
              className="p-1.5 hover:opacity-60 transition-opacity hidden sm:inline-block"
            >
              <Heart className="w-5 h-5" />
            </button>

            <Link
              to="/cart"
              aria-label="Alışveriş Sepeti"
              className="p-1.5 hover:opacity-60 transition-opacity relative"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-surface-inverse text-text-inverse text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-sans font-bold">
                0
              </span>
            </Link>
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

      {/* Mobile Drawer */}
      <MobileNavDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />
    </header>
  );
}

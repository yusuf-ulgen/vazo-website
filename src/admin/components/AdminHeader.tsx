import { Link, useLocation } from 'react-router-dom';
import { Menu, ExternalLink, Bell, User, LogOut, Shield } from 'lucide-react';
import { useAdminAuth } from '../auth/AdminAuthContext';

export interface AdminHeaderProps {
  onOpenMobileSidebar: () => void;
}

export function AdminHeader({ onOpenMobileSidebar }: AdminHeaderProps) {
  const location = useLocation();
  const { adminUser, logout } = useAdminAuth();

  const getBreadcrumbTitle = (pathname: string) => {
    switch (pathname) {
      case '/admin':
        return 'Gösterge Paneli';
      case '/admin/products':
        return 'Ürün Yönetimi';
      case '/admin/categories':
        return 'Kategoriler';
      case '/admin/collections':
        return 'Koleksiyonlar';
      case '/admin/inventory':
        return 'Stok & Envanter';
      case '/admin/pricing':
        return 'Fiyatlandırma';
      case '/admin/wholesale':
        return 'Toptan Portalı';
      case '/admin/content':
        return 'İçerik & CMS';
      case '/admin/submissions':
        return 'Gelen Başvurular';
      case '/admin/settings':
        return 'Sistem Ayarları';
      default:
        return 'Yönetim Paneli';
    }
  };

  const roleLabel = adminUser?.role === 'super_admin' ? 'Süper Admin' : 'Admin';

  return (
    <header className="h-16 bg-surface-primary border-b border-border-default px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Mobile sidebar toggle */}
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-text-secondary hover:text-text-primary rounded"
          aria-label="Admin Menüsünü Aç"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb / Title */}
        <div className="flex items-center gap-2">
          <Link
            to="/admin"
            className="text-xs text-text-secondary hover:text-text-primary font-medium hidden sm:inline transition-colors"
          >
            Admin
          </Link>
          <span className="text-xs text-text-muted hidden sm:inline">/</span>
          <h1 className="text-sm font-semibold text-text-primary">
            {getBreadcrumbTitle(location.pathname)}
          </h1>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* View Public Store */}
        <Link
          to="/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary px-3 py-1.5 border border-border-default rounded transition-colors"
        >
          <span>Mağazayı Gör</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {/* Notification Bell */}
        <button
          aria-label="Bildirimler"
          className="p-2 text-text-secondary hover:text-text-primary rounded transition-colors"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* Admin Avatar & Real Identity */}
        <div className="flex items-center gap-2.5 pl-2.5 border-l border-border-subtle">
          <div className="w-8 h-8 rounded-full bg-neutral-900 text-neutral-100 flex items-center justify-center text-xs font-semibold">
            {adminUser?.role === 'super_admin' ? (
              <Shield className="w-4 h-4 text-amber-400" />
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          <div className="hidden sm:block text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-text-primary leading-tight truncate max-w-[150px]">
                {adminUser?.email.split('@')[0] || 'Admin'}
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-surface-secondary border border-border-subtle text-text-secondary rounded">
                {roleLabel}
              </span>
            </div>
            <span className="block text-[10px] text-text-secondary truncate max-w-[150px]">
              {adminUser?.email || 'admin@vazostudio.com'}
            </span>
          </div>

          <button
            onClick={() => logout()}
            title="Admin Oturumunu Kapat"
            aria-label="Çıkış Yap"
            className="p-1.5 text-text-secondary hover:text-feedback-danger transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

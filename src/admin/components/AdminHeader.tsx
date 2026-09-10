import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ExternalLink, User, LogOut, Shield, KeyRound } from 'lucide-react';
import { useAdminAuth } from '../auth/AdminAuthContext';
import { AdminNotificationPopover } from '../notifications/components/AdminNotificationPopover';
import { AdminChangePasswordModal } from './AdminChangePasswordModal';

export interface AdminHeaderProps {
  onOpenMobileSidebar: () => void;
}

export function AdminHeader({ onOpenMobileSidebar }: AdminHeaderProps) {
  const location = useLocation();
  const { adminUser, logout } = useAdminAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

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
    <>
      <header className="h-16 bg-surface-primary border-b border-border-default px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-shrink">
          {/* Mobile sidebar toggle */}
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-1.5 sm:p-2 -ml-1 text-text-secondary hover:text-text-primary rounded cursor-pointer shrink-0"
            aria-label="Admin Menüsünü Aç"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb / Title */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Link
              to="/admin"
              className="text-xs text-text-secondary hover:text-text-primary font-medium hidden sm:inline transition-colors shrink-0"
            >
              Admin
            </Link>
            <span className="text-xs text-text-muted hidden sm:inline shrink-0">/</span>
            <h1 className="text-xs sm:text-sm font-semibold text-text-primary truncate whitespace-nowrap">
              {getBreadcrumbTitle(location.pathname)}
            </h1>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          {/* View Public Store */}
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            title="Mağazayı Gör"
            aria-label="Mağazayı Gör"
            className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary p-2 sm:px-3 sm:py-1.5 border border-border-default rounded transition-colors shrink-0"
          >
            <span className="hidden md:inline">Mağazayı Gör</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {/* Notification Popover */}
          <div className="shrink-0">
            <AdminNotificationPopover />
          </div>

          {/* Admin Avatar & Real Identity */}
          <div className="flex items-center gap-1 sm:gap-2.5 pl-1.5 sm:pl-2.5 border-l border-border-subtle shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-900 text-neutral-100 flex items-center justify-center text-xs font-semibold shrink-0">
              {adminUser?.role === 'super_admin' ? (
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              ) : (
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
                {adminUser?.email || 'admin@monocactus.com'}
              </span>
            </div>

            {/* Change Password Button */}
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              title="Şifre Değiştir"
              aria-label="Şifre Değiştir"
              className="p-1.5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer rounded hover:bg-surface-secondary shrink-0"
            >
              <KeyRound className="w-4 h-4" />
            </button>

            {/* Logout Button */}
            <button
              onClick={() => logout()}
              title="Admin Oturumunu Kapat"
              aria-label="Çıkış Yap"
              className="p-1.5 text-text-secondary hover:text-feedback-danger transition-colors cursor-pointer rounded hover:bg-surface-secondary shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      <AdminChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </>
  );
}

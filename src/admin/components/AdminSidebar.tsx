import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  Sparkles,
  Boxes,
  Percent,
  Building2,
  FileText,
  Inbox,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function AdminSidebar({
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  const navItems = [
    { label: 'Gösterge Paneli', path: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Ürün Yönetimi', path: '/admin/products', icon: Package },
    { label: 'Kategoriler', path: '/admin/categories', icon: Layers },
    { label: 'Koleksiyonlar', path: '/admin/collections', icon: Sparkles },
    { label: 'Stok & Envanter', path: '/admin/inventory', icon: Boxes },
    { label: 'Fiyatlandırma', path: '/admin/pricing', icon: Percent },
    { label: 'Toptan Portalı', path: '/admin/wholesale', icon: Building2 },
    { label: 'İçerik & CMS', path: '/admin/content', icon: FileText },
    { label: 'Gelen Başvurular', path: '/admin/submissions', icon: Inbox },
    { label: 'Site Ayarları', path: '/admin/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          aria-hidden="true"
          className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 bg-neutral-950 text-neutral-300 border-r border-neutral-800 transition-all duration-300 flex flex-col justify-between',
          isCollapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand & Collapse */}
        <div>
          <div className="h-16 flex items-center justify-between px-5 border-b border-neutral-800">
            {!isCollapsed ? (
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="w-2.5 h-2.5 bg-brand-stone rounded-full" />
                <span className="font-display text-lg tracking-wider text-neutral-100 uppercase">
                  Vazo Admin
                </span>
              </div>
            ) : (
              <div className="mx-auto">
                <span className="w-3 h-3 bg-brand-stone rounded-full block" />
              </div>
            )}

            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
              aria-label={isCollapsed ? 'Menüyü Genişlet' : 'Menüyü Daralt'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded transition-colors group',
                      isActive
                        ? 'bg-neutral-800 text-neutral-50 font-semibold'
                        : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200',
                      isCollapsed && 'justify-center px-2'
                    )
                  }
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* System Security Status Footer */}
        <div className="p-4 border-t border-neutral-800 text-[11px] text-neutral-400">
          {!isCollapsed ? (
            <div className="flex items-center gap-2 text-[10px] text-neutral-400">
              <ShieldCheck className="w-3.5 h-3.5 text-feedback-success shrink-0" />
              <span className="truncate">Supabase RBAC Aktif</span>
            </div>
          ) : (
            <div className="flex justify-center" title="Supabase RBAC Aktif">
              <ShieldCheck className="w-4 h-4 text-feedback-success" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

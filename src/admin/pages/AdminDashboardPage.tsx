import { Link } from 'react-router-dom';
import {
  Package,
  Layers,
  Sparkles,
  Building2,
  FileText,
  Inbox,
  Settings,
  ArrowRight,
  ShieldCheck,
  Database,
  Lock,
  Boxes,
  Percent,
} from 'lucide-react';
import { AdminPageHeader } from '../ui/AdminPageHeader';
import { AdminCard } from '../ui/AdminCard';
import { StatusBadge } from '../ui/StatusBadge';
import { useAdminAuth } from '../auth/AdminAuthContext';

export function AdminDashboardPage() {
  const { adminUser } = useAdminAuth();

  const coreModules = [
    {
      title: 'Ürün Yönetimi',
      description: 'Tasarım seramik vazolar, SKU bazlı varyantlar ve medya galerisi.',
      path: '/admin/products',
      icon: Package,
      phase: 'Faz 2.4 - 2.5',
    },
    {
      title: 'Kategoriler',
      description: 'Masa üstü, zemin ve heykelsi seramik kategori hiyerarşisi.',
      path: '/admin/categories',
      icon: Layers,
      phase: 'Faz 2.6',
    },
    {
      title: 'Koleksiyonlar',
      description: 'Sezonluk kürasyonlar ve koleksiyon hikaye yönetimi.',
      path: '/admin/collections',
      icon: Sparkles,
      phase: 'Faz 2.7',
    },
    {
      title: 'Stok & Envanter',
      description: 'Atölye stok seviyeleri ve kritik stok eşikleri.',
      path: '/admin/inventory',
      icon: Boxes,
      phase: 'Faz 2.8',
    },
    {
      title: 'Fiyatlandırma',
      description: 'Perakende fiyat listeleri ve KDV yapılandırması.',
      path: '/admin/pricing',
      icon: Percent,
      phase: 'Faz 2.8',
    },
    {
      title: 'Toptan Portalı',
      description: 'B2B hacim iskontoları ve mimari başvuru onay süreçleri.',
      path: '/admin/wholesale',
      icon: Building2,
      phase: 'Faz 2.9',
    },
    {
      title: 'İçerik & CMS',
      description: 'Duyuru çubuğu, ana sayfa vitrini ve editoryal bloklar.',
      path: '/admin/content',
      icon: FileText,
      phase: 'Faz 2.10',
    },
    {
      title: 'Gelen Başvurular',
      description: 'Trade başvuruları, iletişim mesajları ve bülten kayıtları.',
      path: '/admin/submissions',
      icon: Inbox,
      phase: 'Faz 2.11',
    },
    {
      title: 'Site Ayarları',
      description: 'Stüdyo bilgileri, iletişim kanalları ve genel parametreler.',
      path: '/admin/settings',
      icon: Settings,
      phase: 'Faz 2.12',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <AdminPageHeader
        title="Yönetim Paneli"
        description={`Hoş geldiniz, ${adminUser?.email || 'Yönetici'}. Vazo E-Ticaret yönetim ve içerik sistemine bağlısınız.`}
        badge={<StatusBadge status="active" label="Sistem Canlı" />}
      />

      {/* System Status Banner */}
      <AdminCard variant="secondary" className="border-border-default">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-feedback-success" />
              <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                Güvenlik & Veritabanı Durumu
              </h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Supabase Auth doğrulaması ve Row Level Security (RLS) politikaları devrededir. Tüm yönetim işlemleri veritabanı düzeyinde yetkilendirilir.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-primary border border-border-default rounded text-text-primary text-[11px]">
              <Database className="w-3.5 h-3.5 text-text-secondary" />
              <span>PostgreSQL RLS</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-primary border border-border-default rounded text-text-primary text-[11px]">
              <Lock className="w-3.5 h-3.5 text-text-secondary" />
              <span>RBAC {adminUser?.role === 'super_admin' ? 'Süper Admin' : 'Admin'}</span>
            </span>
          </div>
        </div>
      </AdminCard>

      {/* Module Navigation Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Yönetim Modülleri
          </h2>
          <span className="text-[11px] text-text-muted">
            {coreModules.length} Aktif Modül
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coreModules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.path}
                to={module.path}
                className="group bg-surface-primary hover:bg-surface-secondary border border-border-default hover:border-text-primary/30 p-5 transition-all shadow-subtle flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded bg-surface-secondary group-hover:bg-surface-primary border border-border-subtle flex items-center justify-center text-text-primary transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-medium text-text-muted group-hover:text-text-secondary transition-colors">
                      {module.phase}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-text-primary group-hover:text-text-primary">
                      {module.title}
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                      {module.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-border-subtle flex items-center justify-between text-xs font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                  <span>Modülü Aç</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

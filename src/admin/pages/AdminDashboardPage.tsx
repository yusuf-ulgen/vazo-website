import { useState, useEffect, useCallback } from 'react';
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
  Boxes,
  Percent,
  AlertTriangle,
  Mail,
  AlertCircle,
  RefreshCw,
  History,
  Database,
  Lock,
} from 'lucide-react';
import { AdminPageHeader, AdminCard, StatusBadge, LoadingSkeleton } from '../ui';
import { useAdminAuth } from '../auth/AdminAuthContext';
import { adminDashboardRepository } from '../dashboard/api/admin-dashboard-repository';
import type { DashboardSummary } from '../dashboard/types';

export function AdminDashboardPage() {
  const { adminUser } = useAdminAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminDashboardRepository.getDashboardSummary();
      setSummary(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gösterge paneli verileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <AdminPageHeader
          title="Yönetim Paneli"
          description={`Hoş geldiniz, ${adminUser?.email || 'Yönetici'}. Vazo E-Ticaret atölye ve mağaza verileri canlı olarak listelenmektedir.`}
          badge={<StatusBadge status="active" label="Sistem Canlı" />}
        />
        <button
          type="button"
          onClick={fetchSummary}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-surface-secondary text-text-secondary hover:text-text-primary rounded-md border border-border-default hover:bg-surface-muted transition-colors self-start sm:self-auto shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Yenile</span>
        </button>
      </div>

      {/* System Status Banner */}
      <AdminCard variant="secondary" className="border-border-default">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted">
              Güvenlik & Veritabanı Durumu
            </span>
            <div className="flex items-center gap-3 text-xs text-text-secondary">
              <span className="flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-feedback-success" />
                PostgreSQL RLS
              </span>
              <span className="text-text-muted">&bull;</span>
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-feedback-success" />
                Admin RBAC
              </span>
              <span className="text-text-muted">&bull;</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-feedback-success" />
                Denetim İzi Aktif
              </span>
            </div>
          </div>
        </div>
      </AdminCard>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-feedback-error/10 border border-feedback-error/20 text-feedback-error rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchSummary}
            className="underline font-semibold hover:opacity-75"
          >
            Tekrar Dene
          </button>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Products Metric */}
        <Link to="/admin/products" className="group block">
          <AdminCard className="h-full hover:border-text-primary/30 transition-all shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted">
                  Ürün Kataloğu
                </span>
                <div className="text-2xl font-display font-medium text-text-primary mt-1">
                  {summary ? summary.products.total : <LoadingSkeleton height="h-7 w-12" />}
                </div>
              </div>
              <div className="p-2 bg-surface-secondary rounded-lg text-text-secondary group-hover:text-text-primary transition-colors">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
              <span>{summary ? `${summary.products.published} Yayında` : '...'}</span>
              <span>{summary ? `${summary.products.draft} Taslak` : '...'}</span>
            </div>
          </AdminCard>
        </Link>

        {/* 2. Stock / Inventory Metric */}
        <Link to="/admin/inventory" className="group block">
          <AdminCard className="h-full hover:border-text-primary/30 transition-all shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted">
                  Stok & Varyantlar
                </span>
                <div className="text-2xl font-display font-medium text-text-primary mt-1">
                  {summary ? summary.inventory.totalVariants : <LoadingSkeleton height="h-7 w-12" />}
                </div>
              </div>
              <div className="p-2 bg-surface-secondary rounded-lg text-text-secondary group-hover:text-text-primary transition-colors">
                <Boxes className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
              {summary ? (
                summary.inventory.lowStockVariants > 0 || summary.inventory.outOfStockVariants > 0 ? (
                  <span className="text-feedback-warning flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {summary.inventory.lowStockVariants + summary.inventory.outOfStockVariants} Kritik/Tükenen
                  </span>
                ) : (
                  <span className="text-feedback-success">Tüm Stoklar Yeterli</span>
                )
              ) : (
                <span className="text-text-muted">Yükleniyor...</span>
              )}
              <span className="text-text-muted">{summary ? `${summary.inventory.inStockVariants} Stokta` : ''}</span>
            </div>
          </AdminCard>
        </Link>

        {/* 3. Submissions Metric */}
        <Link to="/admin/submissions" className="group block">
          <AdminCard className="h-full hover:border-text-primary/30 transition-all shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted">
                  Gelen Talep & Başvuru
                </span>
                <div className="text-2xl font-display font-medium text-text-primary mt-1">
                  {summary ? (
                    summary.submissions.newContactMessages + summary.submissions.pendingTradeApplications
                  ) : (
                    <LoadingSkeleton height="h-7 w-12" />
                  )}
                </div>
              </div>
              <div className="p-2 bg-surface-secondary rounded-lg text-text-secondary group-hover:text-text-primary transition-colors">
                <Inbox className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
              <span>{summary ? `${summary.submissions.newContactMessages} Yeni Mesaj` : '...'}</span>
              <span>{summary ? `${summary.submissions.pendingTradeApplications} Toptan Bekleyen` : '...'}</span>
            </div>
          </AdminCard>
        </Link>

        {/* 4. Audience & Taxonomy Metric */}
        <Link to="/admin/submissions?tab=newsletter" className="group block">
          <AdminCard className="h-full hover:border-text-primary/30 transition-all shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted">
                  Bülten & Kitle
                </span>
                <div className="text-2xl font-display font-medium text-text-primary mt-1">
                  {summary ? summary.submissions.activeNewsletterSubscribers : <LoadingSkeleton height="h-7 w-12" />}
                </div>
              </div>
              <div className="p-2 bg-surface-secondary rounded-lg text-text-secondary group-hover:text-text-primary transition-colors">
                <Mail className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
              <span>{summary ? `${summary.taxonomies.activeCategories} Kategori` : '...'}</span>
              <span>{summary ? `${summary.taxonomies.activeCollections} Koleksiyon` : '...'}</span>
            </div>
          </AdminCard>
        </Link>
      </div>

      {/* Activity Timeline & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Audit Activities (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-text-muted" />
              <h3 className="font-display text-base text-text-primary font-medium">
                Son Denetim & Yönetim Olayları
              </h3>
            </div>
            <Link
              to="/admin/audit"
              className="text-xs font-semibold text-action-primary hover:underline flex items-center gap-1"
            >
              <span>Tüm Günlüğü Gör</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <AdminCard className="divide-y divide-border-subtle p-0 overflow-hidden">
            {!summary ? (
              <div className="p-6 space-y-3">
                <LoadingSkeleton count={3} height="h-8" />
              </div>
            ) : summary.recentAuditLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-muted">
                Henüz kaydedilmiş denetim olayı bulunmuyor.
              </div>
            ) : (
              summary.recentAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-surface-secondary/40 transition-colors text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary truncate">
                        {log.entity_name || log.entity_id}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-secondary text-text-muted">
                        {log.entity_type}
                      </span>
                    </div>
                    <div className="text-[11px] text-text-muted truncate">
                      {log.actor_email || 'Yönetici'} &bull; {new Date(log.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} ({new Date(log.created_at).toLocaleDateString('tr-TR')})
                    </div>
                  </div>
                  <StatusBadge
                    status={
                      log.action === 'CREATE'
                        ? 'active'
                        : log.action === 'DELETE'
                        ? 'draft'
                        : 'info'
                    }
                    label={log.action}
                  />
                </div>
              ))
            )}
          </AdminCard>
        </div>

        {/* Quick Links Hub (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-text-muted" />
            <h3 className="font-display text-base text-text-primary font-medium">
              Yönetim Kısayolları
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {[
              { title: 'Ürün Yönetimi', path: '/admin/products', icon: Package },
              { title: 'Stok & Envanter', path: '/admin/inventory', icon: Boxes },
              { title: 'Fiyatlandırma', path: '/admin/pricing', icon: Percent },
              { title: 'Toptan Portalı', path: '/admin/wholesale', icon: Building2 },
              { title: 'Kategoriler', path: '/admin/categories', icon: Layers },
              { title: 'Koleksiyonlar', path: '/admin/collections', icon: Sparkles },
              { title: 'İçerik & CMS', path: '/admin/content', icon: FileText },
              { title: 'Gelen Başvurular', path: '/admin/submissions', icon: Inbox },
              { title: 'Denetim İzi', path: '/admin/audit', icon: History },
              { title: 'Site Ayarları', path: '/admin/settings', icon: Settings },
            ].map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.path}
                  to={mod.path}
                  className="flex items-center justify-between p-3 bg-surface-primary hover:bg-surface-secondary border border-border-subtle hover:border-border-default rounded-lg transition-all text-xs font-medium text-text-primary shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-text-muted" />
                    <span>{mod.title}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

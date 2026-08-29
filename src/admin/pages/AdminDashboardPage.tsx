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
  AlertTriangle,
  Mail,
  AlertCircle,
  RefreshCw,
  History,
  Database,
  Lock,
  FolderTree,
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
          description={`Hoş geldiniz, ${adminUser?.email || 'Yönetici'}. Vazo E-Ticaret atölye ve sipariş verileri canlı olarak listelenmektedir.`}
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
          <button onClick={fetchSummary} className="underline font-semibold hover:opacity-75">
            Tekrar Dene
          </button>
        </div>
      )}

      {/* Real Live Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Products Metric */}
        <Link to="/admin/products" className="group block">
          <AdminCard className="h-full hover:border-text-primary/30 transition-all shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted">Ürün Kataloğu</span>
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

        {/* Stock & Variants Metric */}
        <Link to="/admin/variants" className="group block">
          <AdminCard className="h-full hover:border-text-primary/30 transition-all shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted">Stok & Varyantlar</span>
                <div className="text-2xl font-display font-medium text-text-primary mt-1">
                  {summary ? summary.inventory.totalVariants : <LoadingSkeleton height="h-7 w-12" />}
                </div>
              </div>
              <div className="p-2 bg-surface-secondary rounded-lg text-text-secondary group-hover:text-text-primary transition-colors">
                <Boxes className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
              <span className="text-text-muted">{summary ? `${summary.inventory.totalVariants} Varyant` : '...'}</span>
              {summary && summary.inventory.lowStockVariants > 0 ? (
                <span className="text-feedback-warning font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {summary.inventory.lowStockVariants} Kritik
                </span>
              ) : (
                <span className="text-feedback-success">Stok Yeterli</span>
              )}
            </div>
          </AdminCard>
        </Link>

        {/* Trade Submissions Metric */}
        <Link to="/admin/submissions?tab=trade" className="group block">
          <AdminCard className="h-full hover:border-text-primary/30 transition-all shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted">Gelen Talep & Başvuru</span>
                <div className="text-2xl font-display font-medium text-text-primary mt-1">
                  {summary ? summary.submissions.pendingTradeApplications : <LoadingSkeleton height="h-7 w-12" />}
                </div>
              </div>
              <div className="p-2 bg-surface-secondary rounded-lg text-text-secondary group-hover:text-text-primary transition-colors">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
              {summary && summary.submissions.pendingTradeApplications > 0 ? (
                <span className="text-feedback-warning font-medium">
                  {summary.submissions.pendingTradeApplications} İnceleme Bekliyor
                </span>
              ) : (
                <span className="text-feedback-success">Tümü İncelendi</span>
              )}
              <span className="text-text-muted">B2B</span>
            </div>
          </AdminCard>
        </Link>

        {/* Newsletter & Audience Metric */}
        <Link to="/admin/submissions?tab=messages" className="group block">
          <AdminCard className="h-full hover:border-text-primary/30 transition-all shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted">Bülten & Kitle</span>
                <div className="text-2xl font-display font-medium text-text-primary mt-1">
                  {summary ? summary.submissions.activeNewsletterSubscribers : <LoadingSkeleton height="h-7 w-12" />}
                </div>
              </div>
              <div className="p-2 bg-surface-secondary rounded-lg text-text-secondary group-hover:text-text-primary transition-colors">
                <Mail className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
              {summary && summary.submissions.newContactMessages > 0 ? (
                <span className="text-accent-primary font-medium">{summary.submissions.newContactMessages} Yeni Mesaj</span>
              ) : (
                <span className="text-text-muted">Yeni Mesaj Yok</span>
              )}
              <span className="text-text-muted">{summary ? `${summary.submissions.activeNewsletterSubscribers} Abone` : ''}</span>
            </div>
          </AdminCard>
        </Link>
      </div>

      {/* Quick Access Module Navigation Cards */}
      <div>
        <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted mb-3">Modüller & Hızlı Erişim</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/admin/products" className="p-4 bg-surface-primary border border-border-default rounded-lg hover:border-text-primary/30 transition-all group flex items-start gap-3 shadow-xs">
            <div className="p-2 bg-surface-secondary rounded-md text-text-secondary group-hover:text-text-primary transition-colors">
              <Package className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold text-text-primary group-hover:text-accent-primary transition-colors flex items-center justify-between">
                <span>Ürün Yönetimi</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </h3>
              <p className="text-[11px] text-text-secondary mt-1 line-clamp-2">Ürün kataloğu ve fiyatlandırma.</p>
            </div>
          </Link>

          <Link to="/admin/categories" className="p-4 bg-surface-primary border border-border-default rounded-lg hover:border-text-primary/30 transition-all group flex items-start gap-3 shadow-xs">
            <div className="p-2 bg-surface-secondary rounded-md text-text-secondary group-hover:text-text-primary transition-colors">
              <FolderTree className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold text-text-primary group-hover:text-accent-primary transition-colors flex items-center justify-between">
                <span>Kategoriler</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </h3>
              <p className="text-[11px] text-text-secondary mt-1 line-clamp-2">Ürün kategorileri ve vitrin düzeni.</p>
            </div>
          </Link>

          <Link to="/admin/collections" className="p-4 bg-surface-primary border border-border-default rounded-lg hover:border-text-primary/30 transition-all group flex items-start gap-3 shadow-xs">
            <div className="p-2 bg-surface-secondary rounded-md text-text-secondary group-hover:text-text-primary transition-colors">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold text-text-primary group-hover:text-accent-primary transition-colors flex items-center justify-between">
                <span>Koleksiyonlar</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </h3>
              <p className="text-[11px] text-text-secondary mt-1 line-clamp-2">Özel seriler ve koleksiyonlar.</p>
            </div>
          </Link>

          <Link to="/admin/variants" className="p-4 bg-surface-primary border border-border-default rounded-lg hover:border-text-primary/30 transition-all group flex items-start gap-3 shadow-xs">
            <div className="p-2 bg-surface-secondary rounded-md text-text-secondary group-hover:text-text-primary transition-colors">
              <Layers className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold text-text-primary group-hover:text-accent-primary transition-colors flex items-center justify-between">
                <span>Stok & Envanter</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </h3>
              <p className="text-[11px] text-text-secondary mt-1 line-clamp-2">Varyant bazlı stok kontrolü.</p>
            </div>
          </Link>

          <Link to="/admin/submissions?tab=trade" className="p-4 bg-surface-primary border border-border-default rounded-lg hover:border-text-primary/30 transition-all group flex items-start gap-3 shadow-xs">
            <div className="p-2 bg-surface-secondary rounded-md text-text-secondary group-hover:text-text-primary transition-colors">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold text-text-primary group-hover:text-accent-primary transition-colors flex items-center justify-between">
                <span>Toptan Portalı</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </h3>
              <p className="text-[11px] text-text-secondary mt-1 line-clamp-2">Kurumsal B2B toptan başvuruları.</p>
            </div>
          </Link>

          <Link to="/admin/content" className="p-4 bg-surface-primary border border-border-default rounded-lg hover:border-text-primary/30 transition-all group flex items-start gap-3 shadow-xs">
            <div className="p-2 bg-surface-secondary rounded-md text-text-secondary group-hover:text-text-primary transition-colors">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold text-text-primary group-hover:text-accent-primary transition-colors flex items-center justify-between">
                <span>İçerik & CMS</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </h3>
              <p className="text-[11px] text-text-secondary mt-1 line-clamp-2">SSS ve kurumsal sayfalar.</p>
            </div>
          </Link>

          <Link to="/admin/submissions" className="p-4 bg-surface-primary border border-border-default rounded-lg hover:border-text-primary/30 transition-all group flex items-start gap-3 shadow-xs">
            <div className="p-2 bg-surface-secondary rounded-md text-text-secondary group-hover:text-text-primary transition-colors">
              <Inbox className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold text-text-primary group-hover:text-accent-primary transition-colors flex items-center justify-between">
                <span>Gelen Başvurular</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </h3>
              <p className="text-[11px] text-text-secondary mt-1 line-clamp-2">Mesajlar ve bülten aboneleri.</p>
            </div>
          </Link>

          <Link to="/admin/settings" className="p-4 bg-surface-primary border border-border-default rounded-lg hover:border-text-primary/30 transition-all group flex items-start gap-3 shadow-xs">
            <div className="p-2 bg-surface-secondary rounded-md text-text-secondary group-hover:text-text-primary transition-colors">
              <Settings className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold text-text-primary group-hover:text-accent-primary transition-colors flex items-center justify-between">
                <span>Site Ayarları</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </h3>
              <p className="text-[11px] text-text-secondary mt-1 line-clamp-2">İletişim ve SEO genel ayarları.</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Audit Activity */}
      <AdminCard>
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <History className="w-4 h-4 text-accent-primary" />
              Son Denetim & Yönetim Olayları
            </h3>
            <p className="text-xs text-text-secondary">
              Atölye panelinde gerçekleştirilen son işlemlerin kriptografik denetim kaydı.
            </p>
          </div>
          <Link
            to="/admin/audit"
            className="text-xs text-accent-primary hover:underline font-medium inline-flex items-center gap-1"
          >
            Tüm Kayıtlar <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {summary && summary.recentAuditLogs.length > 0 ? (
          <div className="divide-y divide-border-subtle text-xs">
            {summary.recentAuditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="px-1.5 py-0.5 font-mono text-[10px] font-semibold bg-surface-secondary text-text-secondary rounded border border-border-default uppercase shrink-0">
                    {log.action}
                  </span>
                  <span className="text-text-primary font-medium truncate">
                    {log.entity_type}: {log.entity_id}
                  </span>
                </div>
                <span className="text-[11px] text-text-muted shrink-0 font-mono">
                  {new Date(log.created_at).toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-text-muted">
            {loading ? 'Denetim kayıtları yükleniyor...' : 'Henüz bir denetim kaydı bulunmuyor.'}
          </div>
        )}
      </AdminCard>
    </div>
  );
}

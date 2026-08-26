import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, AlertCircle, ShieldCheck, Filter } from 'lucide-react';
import {
  AdminPageHeader,
  DataTable,
  Pagination,
  StatusBadge,
} from '@/admin/ui';
import { adminAuditRepository } from '../api/admin-audit-repository';
import { AuditDetailModal } from '../components/AuditDetailModal';
import type {
  AdminAuditLog,
  AuditAction,
  AuditEntityType,
} from '../types';

export function AdminAuditPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [actionFilter, setActionFilter] = useState<'all' | AuditAction>('all');
  const [entityFilter, setEntityFilter] = useState<'all' | AuditEntityType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await adminAuditRepository.getAuditLogs({
        page,
        pageSize,
        action: actionFilter,
        entity_type: entityFilter,
        search: searchQuery,
      });

      setLogs(res.data);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Denetim kayıtları yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, actionFilter, entityFilter, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleOpenDetail = (log: AdminAuditLog) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case 'CREATE':
        return <StatusBadge status="active" label="Oluşturma" />;
      case 'UPDATE':
        return <StatusBadge status="info" label="Güncelleme" />;
      case 'DELETE':
        return <StatusBadge status="draft" label="Silme" />;
      case 'STATUS_CHANGE':
        return <StatusBadge status="warning" label="Durum Değişikliği" />;
      case 'BULK_UPDATE':
        return <StatusBadge status="info" label="Toplu Güncelleme" />;
      default:
        return <StatusBadge status="draft" label={action} />;
    }
  };

  const actionFilters: { id: 'all' | AuditAction; label: string }[] = [
    { id: 'all', label: 'Tüm İşlemler' },
    { id: 'CREATE', label: 'Oluşturma' },
    { id: 'UPDATE', label: 'Güncelleme' },
    { id: 'STATUS_CHANGE', label: 'Durum Değişimi' },
    { id: 'DELETE', label: 'Silme' },
  ];

  const entityOptions: { value: 'all' | AuditEntityType; label: string }[] = [
    { value: 'all', label: 'Tüm Varlık Türleri' },
    { value: 'product', label: 'Ürünler' },
    { value: 'variant', label: 'Ürün Varyantları' },
    { value: 'inventory', label: 'Stok / Envanter' },
    { value: 'price', label: 'Fiyatlandırma' },
    { value: 'wholesale_tier', label: 'Toptan İskonto Kademeleri' },
    { value: 'category', label: 'Kategoriler' },
    { value: 'collection', label: 'Koleksiyonlar' },
    { value: 'cms_page', label: 'CMS Sayfaları' },
    { value: 'cms_section', label: 'CMS Bölümleri' },
    { value: 'faq_group', label: 'SSS Grupları' },
    { value: 'faq_item', label: 'SSS Maddeleri' },
    { value: 'menu_group', label: 'Menü Grupları' },
    { value: 'menu_item', label: 'Menü Linkleri' },
    { value: 'site_settings', label: 'Site Ayarları' },
    { value: 'trade_application', label: 'Toptan Başvuruları' },
    { value: 'contact_message', label: 'İletişim Mesajları' },
    { value: 'newsletter_subscription', label: 'Bülten Aboneleri' },
  ];

  return (
    <div className="space-y-6 text-left animate-fade-in">
      <AdminPageHeader
        title="Denetim İzi & Güvenlik Günlüğü"
        description="Sistem üzerinde gerçekleştirilen tüm yönetimsel değişiklikler, durum güncellemeleri ve konfigürasyon kayıtları."
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-feedback-success/10 text-feedback-success border border-feedback-success/20 rounded-md text-[11px] font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Değiştirilemez Günlük</span>
          </div>
        }
      />

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Action filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {actionFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setActionFilter(f.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors shrink-0 ${
                actionFilter === f.id
                  ? 'bg-action-primary text-action-primary-text'
                  : 'bg-surface-secondary text-text-secondary hover:text-text-primary hover:bg-surface-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Entity select & Search input */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative shrink-0">
            <Filter className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value as 'all' | AuditEntityType);
                setPage(1);
              }}
              className="pl-8 pr-3 py-2 bg-surface-primary border border-border-default rounded-md text-xs text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
            >
              {entityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Varlık adı veya ID ara..."
              className="w-full pl-9 pr-3 py-2 bg-surface-primary border border-border-default rounded-md text-xs text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
            />
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-feedback-error/10 border border-feedback-error/20 text-feedback-error rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchLogs}
            className="underline font-semibold hover:opacity-75"
          >
            Tekrar Dene
          </button>
        </div>
      )}

      {/* Data Table */}
      <div className="space-y-4">
        <DataTable
          isLoading={loading}
          isEmpty={logs.length === 0}
          emptyTitle="Hiç denetim kaydı bulunamadı"
          emptyDescription={
            searchQuery || actionFilter !== 'all' || entityFilter !== 'all'
              ? 'Seçili filtrelere uygun denetim olayı bulunmuyor.'
              : 'Henüz kaydedilmiş bir yönetimsel işlem yok.'
          }
          error={error}
          onRetry={fetchLogs}
        >
          <thead>
            <tr className="bg-surface-secondary/50 border-b border-border-subtle text-text-secondary uppercase text-[11px] font-semibold">
              <th className="py-3 px-4">Tarih & Saat</th>
              <th className="py-3 px-4">İşlem</th>
              <th className="py-3 px-4">Varlık Türü</th>
              <th className="py-3 px-4">Varlık / Hedef</th>
              <th className="py-3 px-4">İşlemi Yapan</th>
              <th className="py-3 px-4 text-right">Detay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle text-text-primary">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-surface-secondary/30 transition-colors">
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="text-left space-y-0.5">
                    <div className="text-xs text-text-primary font-medium">
                      {new Date(log.created_at).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-[11px] text-text-muted font-mono">
                      {new Date(log.created_at).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">{getActionBadge(log.action)}</td>
                <td className="py-3 px-4 font-mono text-xs text-text-secondary">
                  {log.entity_type}
                </td>
                <td className="py-3 px-4 max-w-xs truncate">
                  <div className="text-left space-y-0.5 truncate">
                    <div className="text-xs font-medium text-text-primary truncate">
                      {log.entity_name || log.entity_id}
                    </div>
                    {log.entity_name && (
                      <div className="text-[10px] text-text-muted font-mono truncate">
                        ID: {log.entity_id}
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-xs text-text-secondary truncate max-w-[150px]">
                  {log.actor_email || 'Sistem'}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(log)}
                      className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-muted rounded transition-colors"
                      title="Metadata İncele"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalCount}
          pageSize={pageSize}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* Detail Modal */}
      <AuditDetailModal
        log={selectedLog}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLog(null);
        }}
      />
    </div>
  );
}

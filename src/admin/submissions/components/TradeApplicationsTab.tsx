import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Trash2, AlertCircle } from 'lucide-react';
import {
  DataTable,
  Pagination,
  StatusBadge,
  ConfirmDialog,
  useToast,
} from '@/admin/ui';
import { adminTradeApplicationsRepository } from '../api/admin-trade-applications-repository';
import { TradeApplicationDetailModal } from './TradeApplicationDetailModal';
import type {
  AdminTradeApplication,
  TradeApplicationStatus,
  UpdateTradeApplicationInput,
} from '../types';

export function TradeApplicationsTab() {
  const { success, error: toastError } = useToast();

  const [applications, setApplications] = useState<AdminTradeApplication[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [statusFilter, setStatusFilter] = useState<'all' | TradeApplicationStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal
  const [selectedApplication, setSelectedApplication] = useState<AdminTradeApplication | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Delete Confirmation
  const [deletingAppId, setDeletingAppId] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await adminTradeApplicationsRepository.getTradeApplications({
        page,
        pageSize,
        status: statusFilter,
        search: searchQuery,
      });

      setApplications(res.data);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Başvurular yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, searchQuery]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleOpenDetail = (app: AdminTradeApplication) => {
    setSelectedApplication(app);
    setIsModalOpen(true);
  };

  const handleSaveApplication = async (id: string, input: UpdateTradeApplicationInput) => {
    try {
      await adminTradeApplicationsRepository.updateTradeApplication(id, input);
      success('Güncellendi', 'Toptan başvuru durumu başarıyla kaydedildi.');
      fetchApplications();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Güncelleme başarısız oldu.';
      toastError('Hata', msg);
      throw err;
    }
  };

  const handleApproveApplication = async (id: string, notes?: string) => {
    try {
      const res = await adminTradeApplicationsRepository.approveTradeApplication(id, notes);
      success(
        'Onaylandı',
        res.is_user_bound
          ? 'Toptan başvuru onaylandı ve kullanıcı hesabı toptan statüsüne yükseltildi.'
          : 'Toptan başvuru onaylandı. Kullanıcı kayıt olduğunda e-posta üzerinden otomatik bağlanacaktır.'
      );
      fetchApplications();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Onaylama başarısız oldu.';
      toastError('Hata', msg);
      throw err;
    }
  };

  const handleRevokeApplication = async (id: string, notes?: string) => {
    try {
      await adminTradeApplicationsRepository.revokeWholesaleAccess(id, notes);
      success('İptal Edildi', 'Toptan başvuru reddedildi ve toptan sipariş yetkisi geri alındı.');
      fetchApplications();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Yetki iptali başarısız oldu.';
      toastError('Hata', msg);
      throw err;
    }
  };

  const handleDeleteApplication = async () => {
    if (!deletingAppId) return;

    try {
      await adminTradeApplicationsRepository.deleteTradeApplication(deletingAppId);
      success('Silindi', 'Toptan başvuru kaydı silindi.');
      setDeletingAppId(null);
      fetchApplications();
    } catch (err: unknown) {
      toastError('Hata', err instanceof Error ? err.message : 'Başvuru silinemedi.');
    }
  };

  const getStatusBadge = (status: TradeApplicationStatus) => {
    switch (status) {
      case 'pending':
        return <StatusBadge status="warning" label="Beklemede" />;
      case 'approved':
        return <StatusBadge status="active" label="Onaylandı" />;
      case 'more_info_needed':
        return <StatusBadge status="info" label="Ek Bilgi" />;
      case 'rejected':
        return <StatusBadge status="draft" label="Reddedildi" />;
      default:
        return <StatusBadge status="draft" label={status} />;
    }
  };

  const statusFilters: { id: 'all' | TradeApplicationStatus; label: string }[] = [
    { id: 'all', label: 'Tüm Başvurular' },
    { id: 'pending', label: 'Beklemede' },
    { id: 'approved', label: 'Onaylandı' },
    { id: 'more_info_needed', label: 'Ek Bilgi Gerekli' },
    { id: 'rejected', label: 'Reddedildi' },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {statusFilters.map((filter) => {
            const isActive = statusFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => {
                  setStatusFilter(filter.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-action-primary text-action-primary-text'
                    : 'bg-surface-secondary text-text-secondary hover:text-text-primary hover:bg-surface-muted'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Şirket, vergi no veya yetkili ara..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-surface-secondary border border-border-default rounded-md text-text-primary placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-accent-primary"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-feedback-error/10 border border-feedback-error/20 rounded-md text-feedback-error text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchApplications()}
            className="font-semibold underline hover:opacity-80 ml-2"
          >
            Tekrar Dene
          </button>
        </div>
      )}

      {/* Data Table */}
      <div className="space-y-4">
        <DataTable
          isLoading={loading}
          isEmpty={applications.length === 0}
          emptyTitle="Hiç başvuru bulunamadı"
          emptyDescription={
            searchQuery || statusFilter !== 'all'
              ? 'Arama kriterlerinize uygun kayıt bulunmuyor.'
              : 'Henüz iletilen bir kurumsal toptan başvuru yok.'
          }
          error={error}
          onRetry={fetchApplications}
        >
          <thead>
            <tr className="bg-surface-secondary/50 border-b border-border-subtle text-text-secondary uppercase text-[11px] font-semibold">
              <th className="py-3 px-4">Tarih</th>
              <th className="py-3 px-4">Firma / Şirket</th>
              <th className="py-3 px-4">İletişim</th>
              <th className="py-3 px-4">Faaliyet / Hacim</th>
              <th className="py-3 px-4">Durum</th>
              <th className="py-3 px-4 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle text-text-primary">
            {applications.map((a) => (
              <tr key={a.id} className="hover:bg-surface-secondary/30 transition-colors">
                <td className="py-3 px-4 whitespace-nowrap text-xs text-text-secondary">
                  {new Date(a.submitted_at).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="py-3 px-4">
                  <div className="text-left space-y-0.5">
                    <div className="text-xs font-medium text-text-primary">{a.company_name}</div>
                    <div className="text-[11px] text-text-muted">
                      VN: {a.tax_number} ({a.tax_office})
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-left space-y-0.5 text-xs text-text-secondary">
                    <div className="font-medium text-text-primary">{a.contact_person}</div>
                    <div className="text-[11px] font-mono text-text-muted">{a.email}</div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-left space-y-0.5 text-xs text-text-secondary">
                    <div>{a.business_type}</div>
                    <div className="text-[11px] text-text-muted">{a.estimated_monthly_volume || '-'}</div>
                  </div>
                </td>
                <td className="py-3 px-4">{getStatusBadge(a.status)}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(a)}
                      className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-muted rounded transition-colors"
                      title="Detayları İncele"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingAppId(a.id)}
                      className="p-1.5 text-text-secondary hover:text-feedback-error hover:bg-surface-muted rounded transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
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
      <TradeApplicationDetailModal
        application={selectedApplication}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedApplication(null);
        }}
        onSave={handleSaveApplication}
        onApprove={handleApproveApplication}
        onRevoke={handleRevokeApplication}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingAppId)}
        title="Başvuruyu Sil"
        message="Bu toptan başvuru kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmLabel="Evet, Sil"
        cancelLabel="Vazgeç"
        isDestructive
        onConfirm={handleDeleteApplication}
        onCancel={() => setDeletingAppId(null)}
      />
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import {
  DataTable,
  Pagination,
  StatusBadge,
  ConfirmDialog,
  useToast,
} from '@/admin/ui';
import { adminNewsletterRepository } from '../api/admin-newsletter-repository';
import type {
  AdminNewsletterSubscription,
  NewsletterStatus,
} from '../types';

export function NewsletterTab() {
  const { success, error: toastError } = useToast();

  const [subscriptions, setSubscriptions] = useState<AdminNewsletterSubscription[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [statusFilter, setStatusFilter] = useState<'all' | NewsletterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete Confirmation
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await adminNewsletterRepository.getNewsletterSubscriptions({
        page,
        pageSize,
        status: statusFilter,
        search: searchQuery,
      });

      setSubscriptions(res.data);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bülten aboneleri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, searchQuery]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleToggleStatus = async (sub: AdminNewsletterSubscription) => {
    const newStatus: NewsletterStatus = sub.status === 'active' ? 'unsubscribed' : 'active';
    try {
      await adminNewsletterRepository.updateNewsletterSubscription(sub.id, {
        status: newStatus,
      });
      success(
        'Durum Güncellendi',
        newStatus === 'active' ? 'Abone aktif edildi.' : 'Abonelik iptal edildi.'
      );
      fetchSubscriptions();
    } catch (err: unknown) {
      toastError('Hata', err instanceof Error ? err.message : 'Durum güncellenemedi.');
    }
  };

  const handleDeleteSubscription = async () => {
    if (!deletingSubId) return;

    try {
      await adminNewsletterRepository.deleteNewsletterSubscription(deletingSubId);
      success('Silindi', 'Abone kaydı başarıyla silindi.');
      setDeletingSubId(null);
      fetchSubscriptions();
    } catch (err: unknown) {
      toastError('Hata', err instanceof Error ? err.message : 'Abone silinemedi.');
    }
  };

  const statusFilters: { id: 'all' | NewsletterStatus; label: string }[] = [
    { id: 'all', label: 'Tüm Aboneler' },
    { id: 'active', label: 'Aktif Aboneler' },
    { id: 'unsubscribed', label: 'Ayrılanlar' },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {statusFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setStatusFilter(f.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors shrink-0 ${
                statusFilter === f.id
                  ? 'bg-action-primary text-action-primary-text'
                  : 'bg-surface-secondary text-text-secondary hover:text-text-primary hover:bg-surface-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="E-posta adresi ara..."
            className="w-full pl-9 pr-3 py-2 bg-surface-primary border border-border-default rounded-md text-xs text-text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-primary font-mono"
          />
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
            onClick={fetchSubscriptions}
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
          isEmpty={subscriptions.length === 0}
          emptyTitle="Hiç abone bulunamadı"
          emptyDescription={
            searchQuery || statusFilter !== 'all'
              ? 'Arama kriterlerinize uygun kayıt bulunmuyor.'
              : 'Henüz bültene kayıtlı abone yok.'
          }
          error={error}
          onRetry={fetchSubscriptions}
        >
          <thead>
            <tr className="bg-surface-secondary/50 border-b border-border-subtle text-text-secondary uppercase text-[11px] font-semibold">
              <th className="py-3 px-4">E-posta Adresi</th>
              <th className="py-3 px-4">Kayıt Kaynağı</th>
              <th className="py-3 px-4">Durum</th>
              <th className="py-3 px-4">Kayıt Tarihi</th>
              <th className="py-3 px-4 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle text-text-primary">
            {subscriptions.map((s) => (
              <tr key={s.id} className="hover:bg-surface-secondary/30 transition-colors">
                <td className="py-3 px-4 font-mono text-xs text-text-primary font-medium">
                  {s.normalized_email}
                </td>
                <td className="py-3 px-4 text-xs text-text-secondary">
                  {s.source === 'storefront_footer'
                    ? 'Site Altbilgi (Footer)'
                    : s.source === 'checkout_optin'
                    ? 'Ödeme Sayfası Onayı'
                    : s.source === 'homepage_popup'
                    ? 'Ana Sayfa Vitrini'
                    : s.source}
                </td>
                <td className="py-3 px-4">
                  {s.status === 'active' ? (
                    <StatusBadge status="active" label="Aktif" />
                  ) : (
                    <StatusBadge status="draft" label="Abonelikten Çıktı" />
                  )}
                </td>
                <td className="py-3 px-4 whitespace-nowrap text-xs text-text-secondary">
                  {new Date(s.created_at).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(s)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        s.status === 'active'
                          ? 'text-text-muted hover:text-feedback-error hover:bg-feedback-error/10'
                          : 'text-text-muted hover:text-feedback-success hover:bg-feedback-success/10'
                      }`}
                      title={s.status === 'active' ? 'Abonelikten Çıkar' : 'Aktif Yap'}
                    >
                      {s.status === 'active' ? (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Pasif Yap</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Aktif Yap</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingSubId(s.id)}
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingSubId)}
        title="Aboneliği Sil"
        message="Bu abone kaydını kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmLabel="Evet, Sil"
        cancelLabel="Vazgeç"
        isDestructive
        onConfirm={handleDeleteSubscription}
        onCancel={() => setDeletingSubId(null)}
      />
    </div>
  );
}

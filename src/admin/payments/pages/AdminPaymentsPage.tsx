import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Search,
  RefreshCw,
  Eye,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { AdminPageHeader, AdminCard, StatusBadge, LoadingSkeleton, Pagination } from '@/admin/ui';
import { adminOrderRepository } from '@/entities/order/api/admin-order-repository';
import { PaymentRecord } from '@/entities/order/types';
import { formatMoneyMinor } from '@/shared/lib/money';
import { formatDateTime } from '@/shared/lib/formatters';
import { AdminRefundModal } from '@/admin/orders/components/AdminRefundModal';

export function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Active payment selected for refund modal
  const [selectedPaymentForRefund, setSelectedPaymentForRefund] = useState<PaymentRecord | null>(null);

  const pageSize = 15;

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminOrderRepository.getAdminPayments({
        page: currentPage,
        pageSize,
        status: selectedStatus,
        search: searchQuery,
      });

      setPayments(res.payments);
      setTotalCount(res.total_count);
    } catch (err: unknown) {
      console.error('[AdminPaymentsPage] Error:', err);
      setError(err instanceof Error ? err.message : 'Ödeme kayıtları yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedStatus, searchQuery]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPayments();
  };

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <AdminPageHeader
          title="Ödemeler & İadeler (PayTR)"
          description={`Toplam ${totalCount} ödeme kaydı ve PayTR işlem referansı listelenmektedir. Hassas anahtarlar gizlenmiştir.`}
          badge={<StatusBadge status="active" label={`${totalCount} İşlem`} />}
        />
        <button
          type="button"
          onClick={fetchPayments}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-surface-secondary text-text-secondary hover:text-text-primary rounded-md border border-border-default hover:bg-surface-muted transition-colors self-start sm:self-auto shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Yenile</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <AdminCard>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="PayTR merchant_oid ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-surface-secondary border border-border-default rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary font-mono"
            />
          </form>

          <select
            aria-label="Ödeme Durum Filtresi"
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-surface-secondary border border-border-default rounded-md text-text-primary focus:outline-none font-medium"
          >
            <option value="all">Tüm Ödeme Durumları</option>
            <option value="paid">Başarılı (Ödendi)</option>
            <option value="partially_refunded">Kısmen İade Edildi</option>
            <option value="refunded">Tamamen İade Edildi</option>
            <option value="failed">Başarısız</option>
            <option value="initiated">Başlatıldı (Bekliyor)</option>
            <option value="manual_review">İnceleme Gerekiyor</option>
          </select>
        </div>
      </AdminCard>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-feedback-error/10 border border-feedback-error/20 text-feedback-error rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchPayments} className="underline font-semibold hover:opacity-75">
            Tekrar Dene
          </button>
        </div>
      )}

      {/* Payments Table */}
      <AdminCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border-default bg-surface-secondary/60 text-text-muted font-mono uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Merchant OID</th>
                <th className="py-3 px-4">Tarih</th>
                <th className="py-3 px-4">Sipariş No</th>
                <th className="py-3 px-4">Müşteri</th>
                <th className="py-3 px-4 text-right">Tutar</th>
                <th className="py-3 px-4 text-right">Kalan İade Edilebilir</th>
                <th className="py-3 px-4 text-center">Durum</th>
                <th className="py-3 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4"><LoadingSkeleton height="h-4 w-28" /></td>
                    <td className="py-3 px-4"><LoadingSkeleton height="h-4 w-20" /></td>
                    <td className="py-3 px-4"><LoadingSkeleton height="h-4 w-24" /></td>
                    <td className="py-3 px-4"><LoadingSkeleton height="h-4 w-32" /></td>
                    <td className="py-3 px-4 text-right"><LoadingSkeleton height="h-4 w-16" /></td>
                    <td className="py-3 px-4 text-right"><LoadingSkeleton height="h-4 w-16" /></td>
                    <td className="py-3 px-4 text-center"><LoadingSkeleton height="h-4 w-20" /></td>
                    <td className="py-3 px-4 text-right"><LoadingSkeleton height="h-4 w-16" /></td>
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <span>Filtrelere uygun ödeme kaydı bulunamadı.</span>
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const remaining = Math.max(0, p.expected_amount_minor - (p.refunded_amount_minor || 0));
                  const canRefund = ['paid', 'partially_refunded'].includes(p.status) && remaining > 0;

                  return (
                    <tr key={p.id} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-text-primary flex items-center gap-1.5">
                          <span>{p.merchant_oid}</span>
                          {p.test_mode && (
                            <span className="px-1 py-0.2 bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[9px] font-mono rounded">
                              TEST
                            </span>
                          )}
                        </div>
                        {p.failure_message_safe && (
                          <div className="text-[10px] text-feedback-error mt-0.5 max-w-xs truncate">
                            {p.failure_message_safe}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-text-secondary whitespace-nowrap">
                        {formatDateTime(p.paid_at || p.created_at)}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {p.order_number ? (
                          <Link
                            to={`/admin/orders/${p.order_id}`}
                            className="text-accent-primary hover:underline font-semibold"
                          >
                            {p.order_number}
                          </Link>
                        ) : (
                          <span className="text-text-muted">{p.order_id.slice(0, 8)}...</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        {p.customer_email || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-text-primary whitespace-nowrap">
                        {formatMoneyMinor(p.expected_amount_minor, p.currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-text-secondary whitespace-nowrap">
                        {formatMoneyMinor(remaining, p.currency)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                            p.status === 'paid'
                              ? 'bg-feedback-success/10 text-feedback-success border border-feedback-success/20'
                              : p.status === 'partially_refunded' || p.status === 'refunded'
                              ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                              : p.status === 'failed'
                              ? 'bg-feedback-error/10 text-feedback-error border border-feedback-error/20'
                              : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                        {canRefund && (
                          <button
                            type="button"
                            onClick={() => setSelectedPaymentForRefund(p)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-feedback-warning/10 hover:bg-feedback-warning/20 text-feedback-warning rounded border border-feedback-warning/30 transition-colors shadow-2xs"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>İade</span>
                          </button>
                        )}
                        <Link
                          to={`/admin/orders/${p.order_id}`}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-surface-secondary hover:bg-surface-muted text-text-primary rounded border border-border-default transition-colors shadow-2xs"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Sipariş</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border-default">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </AdminCard>

      {/* Refund Modal */}
      {selectedPaymentForRefund && (
        <AdminRefundModal
          isOpen={Boolean(selectedPaymentForRefund)}
          onClose={() => setSelectedPaymentForRefund(null)}
          payment={selectedPaymentForRefund}
          orderNumber={selectedPaymentForRefund.order_number || selectedPaymentForRefund.order_id}
          onSuccess={fetchPayments}
          onProcessRefund={adminOrderRepository.processPayTRRefund}
        />
      )}
    </div>
  );
}

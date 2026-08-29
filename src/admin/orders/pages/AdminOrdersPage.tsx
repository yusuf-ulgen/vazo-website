import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  RefreshCw,
  Eye,
  Truck,
  AlertCircle,
} from 'lucide-react';
import { AdminPageHeader, AdminCard, StatusBadge, LoadingSkeleton, Pagination } from '@/admin/ui';
import { adminOrderRepository } from '@/entities/order/api/admin-order-repository';
import { AdminOrderSummary, OrderStatus, SalesChannel } from '@/entities/order/types';
import { formatMoneyMinor } from '@/shared/lib/money';
import { formatDateTime } from '@/shared/lib/formatters';

const STATUS_LABELS: Record<OrderStatus, { label: string; variant: 'active' | 'draft' | 'archived' | 'pending' | 'warning' }> = {
  pending_payment: { label: 'Ödeme Bekliyor', variant: 'warning' },
  payment_failed: { label: 'Ödeme Başarısız', variant: 'archived' },
  paid: { label: 'Ödendi', variant: 'active' },
  processing: { label: 'Hazırlanıyor', variant: 'pending' },
  shipped: { label: 'Kargoya Verildi', variant: 'active' },
  delivered: { label: 'Teslim Edildi', variant: 'active' },
  cancelled: { label: 'İptal Edildi', variant: 'archived' },
  partially_refunded: { label: 'Kısmen İade', variant: 'warning' },
  refunded: { label: 'İade Edildi', variant: 'draft' },
  payment_review: { label: 'Ödeme İnceleme', variant: 'warning' },
};

export function AdminOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = (searchParams.get('status') as OrderStatus) || 'all';

  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>(initialStatus);
  const [selectedChannel, setSelectedChannel] = useState<SalesChannel | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const pageSize = 15;

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminOrderRepository.getAdminOrders({
        page: currentPage,
        pageSize,
        status: selectedStatus,
        channel: selectedChannel,
        search: searchQuery,
      });

      setOrders(res.orders);
      setTotalPages(res.total_pages);
      setTotalCount(res.total_count);
    } catch (err: unknown) {
      console.error('[AdminOrdersPage] Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Siparişler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedStatus, selectedChannel, searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusFilterChange = (status: OrderStatus | 'all') => {
    setSelectedStatus(status);
    setCurrentPage(1);
    if (status === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', status);
    }
    setSearchParams(searchParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders();
  };

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <AdminPageHeader
          title="Sipariş Yönetimi"
          description={`Toplam ${totalCount} sipariş kaydı listelenmektedir. Sevkiyat ve durum güncellemelerini yönetebilirsiniz.`}
          badge={<StatusBadge status="active" label={`${totalCount} Sipariş`} />}
        />
        <button
          type="button"
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-surface-secondary text-text-secondary hover:text-text-primary rounded-md border border-border-default hover:bg-surface-muted transition-colors self-start sm:self-auto shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Yenile</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <AdminCard>
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Sipariş no, müşteri adı veya e-posta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-surface-secondary border border-border-default rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          </form>

          {/* Status & Channel Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              aria-label="Kanal Filtresi"
              value={selectedChannel}
              onChange={(e) => {
                setSelectedChannel(e.target.value as SalesChannel | 'all');
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs bg-surface-secondary border border-border-default rounded-md text-text-primary focus:outline-none"
            >
              <option value="all">Tüm Kanallar</option>
              <option value="retail">B2C (Perakende)</option>
              <option value="wholesale">B2B (Toptan)</option>
            </select>

            <select
              aria-label="Durum Filtresi"
              value={selectedStatus}
              onChange={(e) => handleStatusFilterChange(e.target.value as OrderStatus | 'all')}
              className="px-3 py-2 text-xs bg-surface-secondary border border-border-default rounded-md text-text-primary focus:outline-none font-medium"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="paid">Ödendi (Kargo Bekleyen)</option>
              <option value="processing">Hazırlanıyor</option>
              <option value="shipped">Kargoya Verildi</option>
              <option value="delivered">Teslim Edildi</option>
              <option value="pending_payment">Ödeme Bekliyor</option>
              <option value="partially_refunded">Kısmen İade</option>
              <option value="refunded">İade Edildi</option>
              <option value="cancelled">İptal Edildi</option>
            </select>
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
          <button onClick={fetchOrders} className="underline font-semibold hover:opacity-75">
            Tekrar Dene
          </button>
        </div>
      )}

      {/* Orders Table */}
      <AdminCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border-default bg-surface-secondary/60 text-text-muted font-mono uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Sipariş No</th>
                <th className="py-3 px-4">Tarih</th>
                <th className="py-3 px-4">Müşteri</th>
                <th className="py-3 px-4">Kanal</th>
                <th className="py-3 px-4 text-right">Tutar</th>
                <th className="py-3 px-4 text-center">Durum</th>
                <th className="py-3 px-4">Kargo Takip</th>
                <th className="py-3 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4"><LoadingSkeleton height="h-4 w-24" /></td>
                    <td className="py-3 px-4"><LoadingSkeleton height="h-4 w-20" /></td>
                    <td className="py-3 px-4"><LoadingSkeleton height="h-4 w-32" /></td>
                    <td className="py-3 px-4"><LoadingSkeleton height="h-4 w-12" /></td>
                    <td className="py-3 px-4 text-right"><LoadingSkeleton height="h-4 w-16" /></td>
                    <td className="py-3 px-4 text-center"><LoadingSkeleton height="h-4 w-20" /></td>
                    <td className="py-3 px-4"><LoadingSkeleton height="h-4 w-24" /></td>
                    <td className="py-3 px-4 text-right"><LoadingSkeleton height="h-4 w-12" /></td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <span>Filtrelere uygun sipariş kaydı bulunamadı.</span>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const statusConf = STATUS_LABELS[order.status] || { label: order.status, variant: 'draft' };
                  return (
                    <tr key={order.id} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-text-primary">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="text-accent-primary hover:underline"
                        >
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-text-secondary whitespace-nowrap">
                        {formatDateTime(order.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-text-primary">{order.customer_name}</div>
                        <div className="text-[11px] text-text-muted">{order.customer_email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                            order.channel === 'wholesale'
                              ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                              : 'bg-surface-secondary text-text-secondary border border-border-default'
                          }`}
                        >
                          {order.channel === 'wholesale' ? 'Toptan' : 'Perakende'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-text-primary whitespace-nowrap">
                        {formatMoneyMinor(order.total_minor, order.currency)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={statusConf.variant} label={statusConf.label} />
                      </td>
                      <td className="py-3 px-4">
                        {order.shipping_tracking_number ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-text-secondary bg-surface-secondary px-2 py-0.5 rounded border border-border-subtle">
                            <Truck className="w-3 h-3 text-text-muted" />
                            {order.shipping_carrier}: {order.shipping_tracking_number}
                          </span>
                        ) : (
                          <span className="text-[11px] text-text-muted">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-surface-secondary hover:bg-surface-muted text-text-primary rounded border border-border-default transition-colors shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>İncele</span>
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
    </div>
  );
}

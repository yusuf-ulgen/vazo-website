import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingBag,
  CreditCard,
  Truck,
  RotateCcw,
  Clock,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  FileText,
  User,
  MapPin,
  RefreshCw,
  Ban,
  Package,
} from 'lucide-react';
import { AdminCard, LoadingSkeleton } from '@/admin/ui';
import { adminOrderRepository } from '@/entities/order/api/admin-order-repository';
import { AdminOrderDetail, OrderFulfillmentRequest } from '@/entities/order/types';
import { formatMoneyMinor } from '@/shared/lib/money';
import { formatDateTime } from '@/shared/lib/formatters';
import { AdminRefundModal } from '../components/AdminRefundModal';

export function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();

  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fulfillment form states
  const [isUpdatingFulfillment, setIsUpdatingFulfillment] = useState(false);
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [fulfillmentNote, setFulfillmentNote] = useState('');
  const [fulfillmentMsg, setFulfillmentMsg] = useState<string | null>(null);

  // Refund modal state
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  // Cancel order state
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  const fetchOrderDetail = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await adminOrderRepository.getAdminOrderById(orderId);
      if (!data) {
        setError('Sipariş kaydı bulunamadı.');
      } else {
        setOrder(data);
        setCarrier(data.shipping_carrier || 'Yurtiçi Kargo');
        setTrackingNumber(data.shipping_tracking_number || '');
        setTrackingUrl(data.shipping_tracking_url || '');
      }
    } catch (err: unknown) {
      console.error('[AdminOrderDetailPage] Error:', err);
      setError(err instanceof Error ? err.message : 'Sipariş detayı yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const handleFulfillmentTransition = async (targetStatus: 'processing' | 'shipped' | 'delivered') => {
    if (!order) return;
    try {
      setIsUpdatingFulfillment(true);
      setFulfillmentMsg(null);
      const req: OrderFulfillmentRequest = {
        target_status: targetStatus,
        carrier: targetStatus === 'shipped' ? carrier : undefined,
        tracking_number: targetStatus === 'shipped' ? trackingNumber : undefined,
        tracking_url: targetStatus === 'shipped' ? trackingUrl : undefined,
        note: fulfillmentNote || undefined,
      };

      await adminOrderRepository.updateOrderFulfillment(order.id, req);
      setFulfillmentMsg(`Sipariş durumu başarıyla "${targetStatus}" yapıldı.`);
      await fetchOrderDetail();
    } catch (err: unknown) {
      setFulfillmentMsg(err instanceof Error ? err.message : 'Kargo güncellenemedi.');
    } finally {
      setIsUpdatingFulfillment(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !cancelReason.trim()) return;
    try {
      setIsCancelling(true);
      await adminOrderRepository.cancelOrder(order.id, { reason: cancelReason.trim() });
      setShowCancelPrompt(false);
      await fetchOrderDetail();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sipariş iptal edilemedi.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 text-left animate-pulse">
        <LoadingSkeleton height="h-8 w-64" />
        <LoadingSkeleton height="h-48 w-full" />
        <LoadingSkeleton height="h-64 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-6 text-left">
        <Link to="/admin/orders" className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary">
          <ArrowLeft className="w-4 h-4" /> Siparişlere Dön
        </Link>
        <AdminCard className="text-center py-12">
          <AlertCircle className="w-8 h-8 text-feedback-error mx-auto mb-2" />
          <h2 className="text-sm font-semibold text-text-primary">{error || 'Sipariş bulunamadı.'}</h2>
        </AdminCard>
      </div>
    );
  }

  const primaryPayment = order.payments[0];
  const canRefund = primaryPayment && ['paid', 'partially_refunded'].includes(primaryPayment.status);
  const canCancel = ['pending_payment', 'payment_failed', 'payment_review'].includes(order.status);

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* Top Breadcrumb & Status Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/orders"
            className="p-2 bg-surface-secondary hover:bg-surface-muted text-text-secondary hover:text-text-primary rounded-md border border-border-default transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-display font-semibold text-text-primary">
                {order.order_number}
              </h1>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                order.channel === 'wholesale' ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20' : 'bg-surface-secondary text-text-secondary border border-border-default'
              }`}>
                {order.channel === 'wholesale' ? 'B2B Toptan' : 'B2C Perakende'}
              </span>
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">
              Oluşturulma: {formatDateTime(order.created_at)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {canRefund && (
            <button
              type="button"
              onClick={() => setIsRefundModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-feedback-warning/10 hover:bg-feedback-warning/20 text-feedback-warning border border-feedback-warning/30 rounded-md transition-colors shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Para İadesi Yap (Refund)</span>
            </button>
          )}

          {canCancel && !showCancelPrompt && (
            <button
              type="button"
              onClick={() => setShowCancelPrompt(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-feedback-error/10 hover:bg-feedback-error/20 text-feedback-error border border-feedback-error/30 rounded-md transition-colors shadow-xs"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Siparişi İptal Et</span>
            </button>
          )}

          <button
            type="button"
            onClick={fetchOrderDetail}
            className="p-2 bg-surface-secondary text-text-secondary hover:text-text-primary rounded-md border border-border-default hover:bg-surface-muted transition-colors shadow-xs"
            title="Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cancellation Prompt */}
      {showCancelPrompt && (
        <AdminCard className="border-feedback-error/30 bg-feedback-error/5">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-feedback-error">
              <AlertCircle className="w-4 h-4" />
              <span>Ödenmemiş Sipariş İptali & Stok Rezervasyonu Salımı</span>
            </div>
            <p className="text-xs text-text-secondary">
              Bu işlem rezervasyonu serbest bırakacak ve sipariş durumunu iptal olarak işaretleyecektir.
            </p>
            <input
              type="text"
              placeholder="İptal gerekçesi giriniz (zorunlu)..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface-primary border border-border-default rounded-md text-text-primary focus:outline-none"
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowCancelPrompt(false)}
                className="px-3 py-1.5 text-xs bg-surface-secondary border border-border-default rounded-md text-text-secondary"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={isCancelling || !cancelReason.trim()}
                className="px-3 py-1.5 text-xs font-semibold bg-feedback-error text-surface-primary rounded-md disabled:opacity-50"
              >
                {isCancelling ? 'İptal Ediliyor...' : 'İptali Onayla'}
              </button>
            </div>
          </div>
        </AdminCard>
      )}

      {/* Fulfillment Status Control Widget */}
      <AdminCard>
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <h3 className="text-xs font-semibold font-mono uppercase text-text-primary flex items-center gap-2">
              <Truck className="w-4 h-4 text-accent-primary" />
              Sevkiyat & Gönderi Yönetimi
            </h3>
            <span className="text-xs font-mono">
              Mevcut Durum: <strong className="text-text-primary uppercase">{order.status}</strong>
            </span>
          </div>

          {fulfillmentMsg && (
            <div className="p-3 bg-surface-secondary border border-border-default rounded-md text-xs text-text-primary flex items-center justify-between">
              <span>{fulfillmentMsg}</span>
              <button onClick={() => setFulfillmentMsg(null)} className="text-text-muted hover:text-text-primary text-[10px]">Kapat</button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium text-text-muted block mb-1">Kargo Firması</label>
              <input
                type="text"
                placeholder="Örn: Yurtiçi Kargo, MNG..."
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-surface-secondary border border-border-default rounded-md text-text-primary"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-text-muted block mb-1">Takip Numarası</label>
              <input
                type="text"
                placeholder="Örn: YK-123456789"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-surface-secondary border border-border-default rounded-md text-text-primary font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-text-muted block mb-1">Takip Bağlantısı (Opsiyonel)</label>
              <input
                type="url"
                placeholder="https://..."
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-surface-secondary border border-border-default rounded-md text-text-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-text-muted block mb-1">Sevkiyat Notu (Opsiyonel)</label>
            <input
              type="text"
              placeholder="Örn: 2 koli halinde kargolandı..."
              value={fulfillmentNote}
              onChange={(e) => setFulfillmentNote(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-surface-secondary border border-border-default rounded-md text-text-primary"
            />
          </div>

          {/* Action Step Triggers */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-subtle">
            {order.status === 'paid' && (
              <button
                type="button"
                disabled={isUpdatingFulfillment}
                onClick={() => handleFulfillmentTransition('processing')}
                className="px-3 py-1.5 text-xs font-semibold bg-surface-secondary hover:bg-surface-muted text-text-primary rounded border border-border-default transition-colors"
              >
                Hazırlanıyor Olarak İşaretle
              </button>
            )}

            {['paid', 'processing'].includes(order.status) && (
              <button
                type="button"
                disabled={isUpdatingFulfillment || !carrier.trim() || !trackingNumber.trim()}
                onClick={() => handleFulfillmentTransition('shipped')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-feedback-success text-surface-primary rounded hover:bg-feedback-success/90 transition-colors disabled:opacity-50"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Kargoya Verildi Olarak Kaydet</span>
              </button>
            )}

            {order.status === 'shipped' && (
              <button
                type="button"
                disabled={isUpdatingFulfillment}
                onClick={() => handleFulfillmentTransition('delivered')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-accent-primary text-surface-primary rounded hover:bg-accent-primary/90 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Teslim Edildi Olarak Tamamla</span>
              </button>
            )}
          </div>
        </div>
      </AdminCard>

      {/* Customer & Address Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customer Snapshot */}
        <AdminCard className="space-y-2">
          <h4 className="text-[11px] font-mono uppercase text-text-muted flex items-center gap-1.5 font-semibold">
            <User className="w-3.5 h-3.5" /> Müşteri Bilgileri
          </h4>
          <div className="text-xs space-y-1">
            <div className="font-semibold text-text-primary">{order.customer_name}</div>
            <div className="text-text-secondary">{order.customer_email}</div>
            {order.customer_phone && <div className="text-text-muted">{order.customer_phone}</div>}
            <div className="text-[10px] font-mono text-text-muted pt-1">ID: {order.customer_id}</div>
          </div>
        </AdminCard>

        {/* Shipping Address */}
        <AdminCard className="space-y-2">
          <h4 className="text-[11px] font-mono uppercase text-text-muted flex items-center gap-1.5 font-semibold">
            <MapPin className="w-3.5 h-3.5" /> Teslimat Adresi
          </h4>
          <div className="text-xs text-text-secondary space-y-0.5">
            <div className="font-medium text-text-primary">{order.shipping_address.recipient_name}</div>
            <div>{order.shipping_address.address_line1}</div>
            {order.shipping_address.address_line2 && <div>{order.shipping_address.address_line2}</div>}
            <div>{order.shipping_address.city} / {order.shipping_address.country_name}</div>
            <div className="text-[11px] text-text-muted">Tel: {order.shipping_address.phone}</div>
          </div>
        </AdminCard>

        {/* Financial Summary */}
        <AdminCard className="space-y-2">
          <h4 className="text-[11px] font-mono uppercase text-text-muted flex items-center gap-1.5 font-semibold">
            <CreditCard className="w-3.5 h-3.5" /> Mali Özet (KDV Dahil)
          </h4>
          <div className="text-xs space-y-1.5">
            <div className="flex justify-between text-text-secondary">
              <span>Ara Toplam:</span>
              <span className="font-mono">{formatMoneyMinor(order.subtotal_minor, order.currency)}</span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>Kargo:</span>
              <span className="font-mono">
                {order.shipping_minor === 0 ? 'Ücretsiz' : formatMoneyMinor(order.shipping_minor, order.currency)}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-text-muted">
              <span>KDV Dahil Matrah:</span>
              <span className="font-mono">{formatMoneyMinor(order.tax_included_minor || 0, order.currency)}</span>
            </div>
            <div className="flex justify-between font-semibold text-text-primary pt-1.5 border-t border-border-subtle">
              <span>Genel Toplam:</span>
              <span className="font-mono text-sm">{formatMoneyMinor(order.total_minor, order.currency)}</span>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Items Table */}
      <AdminCard className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border-default bg-surface-secondary/40">
          <h3 className="text-xs font-semibold font-mono uppercase text-text-primary flex items-center gap-2">
            <Package className="w-4 h-4 text-accent-primary" />
            Sipariş Edilen Ürünler ({order.items.length} Kalem)
          </h3>
        </div>
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-border-default bg-surface-secondary/60 text-text-muted font-mono uppercase text-[10px]">
              <th className="py-2.5 px-4">Ürün & Varyant</th>
              <th className="py-2.5 px-4">SKU</th>
              <th className="py-2.5 px-4 text-right">Birim Fiyat</th>
              <th className="py-2.5 px-4 text-center">Adet</th>
              <th className="py-2.5 px-4 text-right">Satır Toplamı</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="py-3 px-4 flex items-center gap-3">
                  {item.image_url_snapshot ? (
                    <img
                      src={item.image_url_snapshot}
                      alt={item.product_name_snapshot}
                      className="w-10 h-10 object-cover rounded bg-surface-secondary border border-border-subtle shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-surface-secondary border border-border-subtle flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-4 h-4 text-text-muted" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-text-primary">{item.product_name_snapshot}</div>
                    <div className="text-[11px] text-text-muted">{item.variant_name_snapshot}</div>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-text-secondary">{item.sku_snapshot}</td>
                <td className="py-3 px-4 text-right font-mono">{formatMoneyMinor(item.unit_price_minor, item.currency)}</td>
                <td className="py-3 px-4 text-center font-mono font-medium">{item.quantity}</td>
                <td className="py-3 px-4 text-right font-mono font-semibold text-text-primary">
                  {formatMoneyMinor(item.line_total_minor, item.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminCard>

      {/* Payments & Refunds Ledger */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payments */}
        <AdminCard className="space-y-3">
          <h3 className="text-xs font-semibold font-mono uppercase text-text-primary flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-accent-primary" />
            Ödeme Denemeleri (PayTR)
          </h3>
          {order.payments.length === 0 ? (
            <div className="py-6 text-center text-xs text-text-muted">Ödeme denemesi bulunmuyor.</div>
          ) : (
            <div className="divide-y divide-border-subtle text-xs space-y-2">
              {order.payments.map((p) => (
                <div key={p.id} className="pt-2 first:pt-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-text-primary">{p.merchant_oid}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                      p.status === 'paid' ? 'bg-feedback-success/10 text-feedback-success' : 'bg-feedback-warning/10 text-feedback-warning'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-text-secondary">
                    <span>Tutar: {formatMoneyMinor(p.expected_amount_minor, p.currency)}</span>
                    <span>İade: {formatMoneyMinor(p.refunded_amount_minor || 0, p.currency)}</span>
                  </div>
                  {p.test_mode && (
                    <span className="inline-block px-1.5 py-0.2 bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[9px] font-mono rounded">
                      PayTR Test Modu
                    </span>
                  )}
                  {p.paid_at && <div className="text-[10px] text-text-muted">Ödeme Zamanı: {formatDateTime(p.paid_at)}</div>}
                </div>
              ))}
            </div>
          )}
        </AdminCard>

        {/* Refunds */}
        <AdminCard className="space-y-3">
          <h3 className="text-xs font-semibold font-mono uppercase text-text-primary flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-accent-primary" />
            İade Kayıtları ({order.refunds.length})
          </h3>
          {order.refunds.length === 0 ? (
            <div className="py-6 text-center text-xs text-text-muted">Henüz bir iade işlemi yapılmadı.</div>
          ) : (
            <div className="divide-y divide-border-subtle text-xs space-y-2">
              {order.refunds.map((r) => (
                <div key={r.id} className="pt-2 first:pt-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-text-primary">{r.reference_no}</span>
                    <span className="font-mono font-semibold text-feedback-warning">
                      {formatMoneyMinor(r.amount_minor, r.currency)}
                    </span>
                  </div>
                  <div className="text-[11px] text-text-muted">Neden: {r.safe_reason || 'Belirtilmedi'}</div>
                  {r.completed_at && <div className="text-[10px] text-text-muted">Tarih: {formatDateTime(r.completed_at)}</div>}
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      </div>

      {/* Legal Acceptances Snapshot */}
      {order.legal_acceptances && order.legal_acceptances.length > 0 && (
        <AdminCard className="space-y-3">
          <h3 className="text-xs font-semibold font-mono uppercase text-text-primary flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-accent-primary" />
            Hukuki Sözleşme ve Onay Kayıtları
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {order.legal_acceptances.map((acc) => (
              <div key={acc.id} className="p-3 bg-surface-secondary rounded border border-border-subtle flex items-start gap-2">
                <FileText className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-text-primary uppercase text-[11px]">
                    {acc.document_key.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[10px] text-text-muted">
                    Versiyon: {acc.document_version} &bull; Onay: {formatDateTime(acc.accepted_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      )}

      {/* Status History Timeline */}
      <AdminCard className="space-y-3">
        <h3 className="text-xs font-semibold font-mono uppercase text-text-primary flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent-primary" />
          Sipariş Durum Geçmişi
        </h3>
        <div className="space-y-3 text-xs pl-2 border-l-2 border-border-default">
          {order.status_history.map((h) => (
            <div key={h.id} className="relative pl-3 space-y-0.5">
              <div className="w-2 h-2 rounded-full bg-accent-primary absolute -left-[17px] top-1" />
              <div className="font-semibold text-text-primary">
                {h.from_status ? `${h.from_status} → ` : ''}{h.to_status}
              </div>
              {h.note && <div className="text-text-secondary">{h.note}</div>}
              <div className="text-[10px] text-text-muted">
                {h.actor_type.toUpperCase()} &bull; {formatDateTime(h.created_at)}
              </div>
            </div>
          ))}
        </div>
      </AdminCard>

      {/* PayTR Refund Modal */}
      {primaryPayment && (
        <AdminRefundModal
          isOpen={isRefundModalOpen}
          onClose={() => setIsRefundModalOpen(false)}
          payment={primaryPayment}
          orderNumber={order.order_number}
          onSuccess={fetchOrderDetail}
          onProcessRefund={adminOrderRepository.processPayTRRefund}
        />
      )}
    </div>
  );
}

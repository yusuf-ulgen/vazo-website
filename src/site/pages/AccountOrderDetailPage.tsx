import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Package,
  Calendar,
  Truck,
  MapPin,
  FileText,
  ArrowLeft,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Section } from '@/shared/ui/Section';
import { Container } from '@/shared/ui/Container';
import { Badge } from '@/shared/ui/Badge';
import { CustomerAuthGuard } from '@/site/auth/CustomerAuthGuard';
import { orderRepository } from '@/entities/order/api/order-repository';
import { Order, OrderStatus } from '@/entities/order/types';
import { formatMoneyMinor } from '@/shared/lib/money';
import { useSEO } from '@/shared/lib/seo';

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'muted' }> = {
  pending_payment: { label: 'Ödeme Bekleniyor', variant: 'warning' },
  paid: { label: 'Ödeme Onaylandı', variant: 'success' },
  processing: { label: 'Hazırlanıyor', variant: 'default' },
  shipped: { label: 'Kargoya Verildi', variant: 'success' },
  delivered: { label: 'Teslim Edildi', variant: 'success' },
  cancelled: { label: 'İptal Edildi', variant: 'danger' },
  partially_refunded: { label: 'Kısmi İade', variant: 'muted' },
  refunded: { label: 'İade Edildi', variant: 'muted' },
  payment_failed: { label: 'Ödeme Başarısız', variant: 'danger' },
  payment_review: { label: 'İncelemede', variant: 'warning' },
};

function AccountOrderDetailContent() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useSEO({
    title: order ? `Sipariş ${order.order_number} | Vazo Studio` : 'Sipariş Detayı',
    description: 'Vazo Studio sipariş detayları ve teslimat durumu.',
  });

  useEffect(() => {
    if (!orderId) return;

    let isMounted = true;
    orderRepository
      .getOrderById(orderId)
      .then((data) => {
        if (isMounted) {
          setOrder(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Sipariş yüklenemedi.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="py-24 flex items-center justify-center text-xs text-text-muted gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Sipariş bilgileri yükleniyor...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <Section className="py-16">
        <Container size="sm">
          <div className="text-center p-8 bg-surface-primary border border-border-default rounded-sm space-y-4">
            <Package className="w-8 h-8 text-text-muted mx-auto" />
            <h2 className="font-display text-xl text-text-primary">Sipariş Bulunamadı</h2>
            <p className="text-xs text-text-secondary">
              {error || 'Aradığınız sipariş kaydına ulaşılamadı veya görüntüleme yetkiniz yok.'}
            </p>
            <Link
              to="/account/orders"
              className="inline-block px-5 py-2.5 bg-text-primary text-canvas-default text-xs font-semibold hover:opacity-90"
            >
              Siparişlerime Dön
            </Link>
          </div>
        </Container>
      </Section>
    );
  }

  const statusCfg = STATUS_CONFIG[order.status] || { label: order.status, variant: 'muted' };
  const dateFormatted = new Date(order.created_at).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Section className="py-12 md:py-16 text-left">
      <Container size="lg">
        {/* Top Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-default pb-6 mb-8">
          <div>
            <nav className="text-xs text-text-muted flex items-center gap-1.5 font-sans mb-1">
              <Link to="/account" className="hover:text-text-primary">
                Hesabım
              </Link>
              <span>/</span>
              <Link to="/account/orders" className="hover:text-text-primary">
                Siparişlerim
              </Link>
              <span>/</span>
              <span className="text-text-primary font-medium">{order.order_number}</span>
            </nav>

            <div className="flex items-center gap-3 mt-1">
              <h1 className="font-mono text-2xl sm:text-3xl font-bold text-text-primary">
                {order.order_number}
              </h1>
              <Badge variant={statusCfg.variant} className="text-xs">
                {statusCfg.label}
              </Badge>
            </div>
            <p className="text-xs text-text-muted mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Sipariş Tarihi: {dateFormatted}</span>
            </p>
          </div>

          <Link
            to="/account/orders"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface-muted text-text-primary text-xs font-medium rounded-xs hover:bg-surface-secondary self-start sm:self-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tüm Siparişlere Dön</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Items & Tracking */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tracking Banner if Shipped */}
            {order.shipping_tracking_number && (
              <div className="p-4 bg-surface-muted border border-border-default rounded-sm flex items-start gap-3">
                <Truck className="w-5 h-5 text-accent-primary shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-text-primary">
                    Kargo Takip: {order.shipping_carrier || 'Anlaşmalı Kargo'}
                  </p>
                  <p className="text-text-secondary font-mono">
                    Takip No: {order.shipping_tracking_number}
                  </p>
                  {order.shipping_tracking_url && (
                    <a
                      href={order.shipping_tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-primary underline inline-flex items-center gap-1 font-semibold"
                    >
                      Kargoyu Canlı Takip Et
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Order Items List */}
            <div className="bg-surface-primary border border-border-default rounded-sm p-6 space-y-4">
              <h2 className="font-display text-lg text-text-primary pb-3 border-b border-border-subtle">
                Sipariş Edilen Ürünler
              </h2>

              <div className="divide-y divide-border-subtle">
                {order.items?.map((item) => (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                    <div className="w-16 h-16 bg-surface-muted rounded-xs overflow-hidden shrink-0 border border-border-subtle">
                      {item.image_url_snapshot ? (
                        <img
                          src={item.image_url_snapshot}
                          alt={item.product_name_snapshot}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-muted text-[10px]">
                          Görsel Yok
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-text-primary truncate">
                        {item.product_name_snapshot}
                      </h3>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {item.variant_name_snapshot} • SKU: {item.sku_snapshot}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-text-muted">
                        <span>Adet: {item.quantity}</span>
                        <span>•</span>
                        <span>Birim: {formatMoneyMinor(item.unit_price_minor, item.currency)}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-semibold text-text-primary">
                        {formatMoneyMinor(item.line_total_minor, item.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Col: Addresses & Totals Summary */}
          <div className="space-y-6">
            {/* Totals Summary */}
            <div className="bg-surface-primary border border-border-default rounded-sm p-6 space-y-3">
              <h3 className="font-display text-base text-text-primary pb-2 border-b border-border-subtle">
                Ödeme Özeti
              </h3>

              <div className="flex justify-between text-xs text-text-secondary">
                <span>Ara Toplam</span>
                <span className="text-text-primary font-medium">
                  {formatMoneyMinor(order.subtotal_minor, order.currency)}
                </span>
              </div>

              <div className="flex justify-between text-xs text-text-secondary">
                <span>Kargo Bedeli</span>
                <span className="text-text-primary font-medium">
                  {order.shipping_minor === 0 ? (
                    <span className="text-feedback-success font-semibold">Ücretsiz</span>
                  ) : (
                    formatMoneyMinor(order.shipping_minor, order.currency)
                  )}
                </span>
              </div>

              {order.discount_minor > 0 && (
                <div className="flex justify-between text-xs text-feedback-success">
                  <span>İndirim</span>
                  <span>-{formatMoneyMinor(order.discount_minor, order.currency)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-border-subtle flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-bold text-text-primary">Toplam Tutar</span>
                  <span className="block text-[10px] text-text-muted mt-0.5">
                    KDV Dahildir (%20 Dahil: {formatMoneyMinor(order.tax_included_minor || 0, order.currency)})
                  </span>
                </div>
                <span className="font-display text-xl font-bold text-text-primary">
                  {formatMoneyMinor(order.total_minor, order.currency)}
                </span>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-surface-primary border border-border-default rounded-sm p-6 text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-text-primary font-semibold text-sm pb-2 border-b border-border-subtle">
                <MapPin className="w-4 h-4 text-text-muted" />
                <h4>Teslimat Adresi</h4>
              </div>
              <p className="font-medium text-text-primary">
                {order.shipping_address.recipient_name}
              </p>
              <p className="text-text-secondary leading-relaxed">
                {order.shipping_address.address_line1} {order.shipping_address.address_line2}
              </p>
              <p className="text-text-muted">
                {order.shipping_address.district ? `${order.shipping_address.district} / ` : ''}
                {order.shipping_address.city}, {order.shipping_address.country_name}
              </p>
              <p className="text-text-muted pt-1">Tel: {order.shipping_address.phone}</p>
            </div>

            {/* Billing Address */}
            <div className="bg-surface-primary border border-border-default rounded-sm p-6 text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-text-primary font-semibold text-sm pb-2 border-b border-border-subtle">
                <FileText className="w-4 h-4 text-text-muted" />
                <h4>Fatura Adresi</h4>
              </div>
              <p className="font-medium text-text-primary">
                {order.billing_address.recipient_name}
              </p>
              <p className="text-text-secondary leading-relaxed">
                {order.billing_address.address_line1} {order.billing_address.address_line2}
              </p>
              <p className="text-text-muted">
                {order.billing_address.district ? `${order.billing_address.district} / ` : ''}
                {order.billing_address.city}, {order.billing_address.country_name}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export function AccountOrderDetailPage() {
  return (
    <CustomerAuthGuard>
      <AccountOrderDetailContent />
    </CustomerAuthGuard>
  );
}

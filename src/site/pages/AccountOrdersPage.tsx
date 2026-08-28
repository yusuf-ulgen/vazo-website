import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Calendar, ArrowRight, Loader2, ShoppingBag } from 'lucide-react';
import { Section } from '@/shared/ui/Section';
import { Container } from '@/shared/ui/Container';
import { Badge } from '@/shared/ui/Badge';
import { CustomerAuthGuard } from '@/site/auth/CustomerAuthGuard';
import { orderRepository } from '@/entities/order/api/order-repository';
import { Order, OrderStatus } from '@/entities/order/types';
import { formatMoneyMinor } from '@/shared/lib/money';
import { useSEO } from '@/shared/lib/seo';

const STATUS_LABELS: Record<OrderStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'muted' }> = {
  pending_payment: { label: 'Ödeme Bekleniyor', variant: 'warning' },
  paid: { label: 'Ödeme Alındı', variant: 'success' },
  processing: { label: 'Hazırlanıyor', variant: 'default' },
  shipped: { label: 'Kargoya Verildi', variant: 'success' },
  delivered: { label: 'Teslim Edildi', variant: 'success' },
  cancelled: { label: 'İptal Edildi', variant: 'danger' },
  partially_refunded: { label: 'Kısmi İade', variant: 'muted' },
  refunded: { label: 'İade Edildi', variant: 'muted' },
  payment_failed: { label: 'Ödeme Başarısız', variant: 'danger' },
  payment_review: { label: 'İncelemede', variant: 'warning' },
};

function AccountOrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useSEO({
    title: 'Siparişlerim | Vazo Studio',
    description: 'Vazo Studio sipariş geçmişiniz ve kargo takibi.',
  });

  useEffect(() => {
    let isMounted = true;
    orderRepository
      .getCustomerOrders()
      .then((data) => {
        if (isMounted) {
          setOrders(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Siparişler yüklenemedi.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Section className="py-12 md:py-16">
      <Container size="lg">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-default pb-6 mb-8 text-left">
          <div>
            <nav className="text-xs text-text-muted flex items-center gap-1.5 font-sans mb-1">
              <Link to="/account" className="hover:text-text-primary">
                Hesabım
              </Link>
              <span>/</span>
              <span className="text-text-primary font-medium">Siparişlerim</span>
            </nav>
            <h1 className="font-display text-3xl md:text-4xl text-text-primary">
              Geçmiş Siparişlerim
            </h1>
          </div>

          <Link
            to="/account"
            className="text-xs text-text-secondary hover:text-text-primary underline"
          >
            Hesap Özetine Dön
          </Link>
        </div>

        {/* Orders Content */}
        {isLoading ? (
          <div className="py-16 flex items-center justify-center text-xs text-text-muted gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Siparişleriniz yükleniyor...</span>
          </div>
        ) : error ? (
          <div className="p-6 bg-feedback-error/10 border border-feedback-error/20 text-xs text-feedback-error text-center rounded-xs">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border-default bg-surface-secondary/40 p-8 rounded-sm">
            <Package className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <h2 className="font-display text-xl text-text-primary mb-1">Henüz Siparişiniz Yok</h2>
            <p className="text-xs text-text-secondary max-w-sm mx-auto mb-6">
              Özel seramik koleksiyonlarımızı keşfederek ilk siparişinizi verebilirsiniz.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-text-primary text-canvas-default text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <ShoppingBag className="w-4 h-4" />
              Koleksiyonu İncele
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusCfg = STATUS_LABELS[order.status] || {
                label: order.status,
                variant: 'muted',
              };
              const dateFormatted = new Date(order.created_at).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              return (
                <div
                  key={order.id}
                  className="bg-surface-primary border border-border-default rounded-sm p-5 sm:p-6 shadow-xs hover:border-text-primary/40 transition-colors text-left"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-border-subtle">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-text-primary">
                          {order.order_number}
                        </span>
                        <Badge variant={statusCfg.variant} className="text-[10px]">
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{dateFormatted}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <span className="block text-[10px] uppercase text-text-muted">Toplam</span>
                        <span className="font-display text-lg font-bold text-text-primary">
                          {formatMoneyMinor(order.total_minor, order.currency)}
                        </span>
                      </div>

                      <Link
                        to={`/account/orders/${order.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-muted text-text-primary text-xs font-medium rounded-xs hover:bg-surface-secondary transition-colors shrink-0"
                      >
                        <span>Detay</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Items Preview */}
                  {order.items && order.items.length > 0 && (
                    <div className="pt-3 flex flex-wrap gap-2 text-xs text-text-secondary">
                      {order.items.map((item) => (
                        <span
                          key={item.id}
                          className="px-2.5 py-1 bg-surface-secondary border border-border-subtle rounded-xs truncate max-w-xs"
                        >
                          {item.quantity}x {item.product_name_snapshot} ({item.variant_name_snapshot})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </Section>
  );
}

export function AccountOrdersPage() {
  return (
    <CustomerAuthGuard>
      <AccountOrdersContent />
    </CustomerAuthGuard>
  );
}

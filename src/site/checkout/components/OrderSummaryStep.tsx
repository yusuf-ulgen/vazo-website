import { CheckoutQuoteResponse } from '@/entities/order/types';
import { formatMoneyMinor } from '@/shared/lib/money';
import { Truck, ShieldCheck } from 'lucide-react';

interface OrderSummaryStepProps {
  quote: CheckoutQuoteResponse;
}

export function OrderSummaryStep({ quote }: OrderSummaryStepProps) {
  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-border-subtle pb-4">
        <h2 className="font-display text-2xl text-text-primary">Sipariş Özeti</h2>
        <p className="text-xs text-text-secondary mt-1">
          Lütfen sipariş etmek istediğiniz ürünleri ve teslimat ücretini inceleyin.
        </p>
      </div>

      {/* Item List */}
      <div className="divide-y divide-border-subtle border border-border-default rounded-sm bg-surface-primary overflow-hidden">
        {quote.items.map((item) => (
          <div key={item.variant_id} className="p-4 flex items-center gap-4">
            <div className="w-16 h-16 bg-surface-muted rounded-xs overflow-hidden shrink-0 border border-border-subtle">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.product_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
                  Görsel Yok
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-text-primary truncate">{item.product_name}</h3>
              <p className="text-xs text-text-secondary mt-0.5">{item.variant_name}</p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-text-muted">
                <span>Adet: {item.quantity}</span>
                <span>•</span>
                <span>Birim: {formatMoneyMinor(item.unit_price_minor, quote.currency)}</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-sm font-semibold text-text-primary">
                {formatMoneyMinor(item.line_total_minor, quote.currency)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Financial Breakdown */}
      <div className="p-5 bg-surface-secondary border border-border-default rounded-sm space-y-3">
        <div className="flex justify-between text-xs text-text-secondary">
          <span>Ara Toplam</span>
          <span className="text-text-primary font-medium">
            {formatMoneyMinor(quote.subtotal_minor, quote.currency)}
          </span>
        </div>

        <div className="flex justify-between text-xs text-text-secondary items-center">
          <div className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-text-muted" />
            <span>Kargo Ücreti ({quote.destination_country})</span>
          </div>
          <span className="text-text-primary font-medium">
            {quote.free_shipping_applied ? (
              <span className="text-feedback-success font-semibold">Ücretsiz Kargo</span>
            ) : (
              formatMoneyMinor(quote.shipping_minor, quote.currency)
            )}
          </span>
        </div>

        {quote.estimated_delivery_text && (
          <p className="text-[11px] text-text-muted italic">
            Tahmini Teslimat: {quote.estimated_delivery_text}
          </p>
        )}

        <div className="pt-3 border-t border-border-subtle flex justify-between items-baseline">
          <div>
            <span className="text-sm font-semibold text-text-primary">Genel Toplam</span>
            <span className="block text-[11px] text-text-muted mt-0.5">
              Fiyatlarımıza KDV Dahildir (%20 Dahil: {formatMoneyMinor(quote.tax_included_minor, quote.currency)})
            </span>
          </div>
          <span className="font-display text-2xl font-semibold text-text-primary">
            {formatMoneyMinor(quote.total_minor, quote.currency)}
          </span>
        </div>
      </div>

      {/* Security Banner */}
      <div className="flex items-center gap-2.5 p-3.5 bg-surface-muted/60 border border-border-subtle rounded-xs text-xs text-text-secondary">
        <ShieldCheck className="w-4 h-4 text-feedback-info shrink-0" />
        <span>
          Siparişiniz tamamlandığında stoklar adınıza <strong>40 dakika</strong> süreyle rezerve edilecektir.
        </span>
      </div>
    </div>
  );
}

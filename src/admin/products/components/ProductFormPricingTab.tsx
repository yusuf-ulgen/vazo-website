import React from 'react';

interface ProductFormPricingTabProps {
  retailPrice: string;
  onRetailPriceChange: (val: string) => void;
  compareAtPrice: string;
  onCompareAtPriceChange: (val: string) => void;
  retailEnabled: boolean;
  onRetailEnabledChange: (val: boolean) => void;
  wholesaleEnabled: boolean;
  onWholesaleEnabledChange: (val: boolean) => void;
  wholesaleMoq: string;
  onWholesaleMoqChange: (val: string) => void;
  wholesaleLeadTimeDays: string;
  onWholesaleLeadTimeDaysChange: (val: string) => void;
  featured: boolean;
  onFeaturedChange: (val: boolean) => void;
  newArrival: boolean;
  onNewArrivalChange: (val: boolean) => void;
  bestseller: boolean;
  onBestsellerChange: (val: boolean) => void;
}

export const ProductFormPricingTab: React.FC<ProductFormPricingTabProps> = ({
  retailPrice,
  onRetailPriceChange,
  compareAtPrice,
  onCompareAtPriceChange,
  retailEnabled,
  onRetailEnabledChange,
  wholesaleEnabled,
  onWholesaleEnabledChange,
  wholesaleMoq,
  onWholesaleMoqChange,
  wholesaleLeadTimeDays,
  onWholesaleLeadTimeDaysChange,
  featured,
  onFeaturedChange,
  newArrival,
  onNewArrivalChange,
  bestseller,
  onBestsellerChange,
}) => {
  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="product-retail-price" className="block text-xs font-medium text-text-primary mb-1">
            Perakende Satış Fiyatı (₺) <span className="text-status-danger">*</span>
          </label>
          <input
            id="product-retail-price"
            type="number"
            step="0.01"
            min="0"
            value={retailPrice}
            onChange={(e) => onRetailPriceChange(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-accent-primary"
            required
          />
        </div>

        <div>
          <label htmlFor="product-compare-price" className="block text-xs font-medium text-text-primary mb-1">
            Eski / Karşılaştırma Fiyatı (₺)
          </label>
          <input
            id="product-compare-price"
            type="number"
            step="0.01"
            min="0"
            value={compareAtPrice}
            onChange={(e) => onCompareAtPriceChange(e.target.value)}
            placeholder="Opsiyonel (İndirim öncesi)"
            className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-accent-primary"
          />
        </div>
      </div>

      <div className="p-3 bg-canvas-subtle rounded-md space-y-2.5">
        <span className="block text-xs font-semibold text-text-primary">Kanal ve Satış Yetkileri</span>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-text-primary">
            <input
              type="checkbox"
              checked={retailEnabled}
              onChange={(e) => onRetailEnabledChange(e.target.checked)}
              className="rounded border-border-default text-accent-primary focus:ring-accent-primary"
            />
            <span>Perakende (B2C) Satışa Açık</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-text-primary">
            <input
              type="checkbox"
              checked={wholesaleEnabled}
              onChange={(e) => onWholesaleEnabledChange(e.target.checked)}
              className="rounded border-border-default text-accent-primary focus:ring-accent-primary"
            />
            <span>Toptan (B2B) Satışa Açık</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="product-moq" className="block text-xs font-medium text-text-primary mb-1">
            Toptan Minimum Sipariş Adedi (MOQ)
          </label>
          <input
            id="product-moq"
            type="number"
            min="1"
            value={wholesaleMoq}
            onChange={(e) => onWholesaleMoqChange(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-accent-primary"
          />
        </div>

        <div>
          <label htmlFor="product-lead-time" className="block text-xs font-medium text-text-primary mb-1">
            Toptan Üretim & Teslimat Süresi (Gün)
          </label>
          <input
            id="product-lead-time"
            type="number"
            min="1"
            value={wholesaleLeadTimeDays}
            onChange={(e) => onWholesaleLeadTimeDaysChange(e.target.value)}
            placeholder="14"
            className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-accent-primary"
          />
        </div>
      </div>

      <div className="p-3 bg-canvas-subtle rounded-md space-y-2.5">
        <span className="block text-xs font-semibold text-text-primary">Vitrin ve Rozet Kontrolleri</span>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-text-primary">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => onFeaturedChange(e.target.checked)}
              className="rounded border-border-default text-accent-primary focus:ring-accent-primary"
            />
            <span>Öne Çıkan Ürün (Featured)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-text-primary">
            <input
              type="checkbox"
              checked={newArrival}
              onChange={(e) => onNewArrivalChange(e.target.checked)}
              className="rounded border-border-default text-accent-primary focus:ring-accent-primary"
            />
            <span>Yeni Gelen (New Arrival)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-text-primary">
            <input
              type="checkbox"
              checked={bestseller}
              onChange={(e) => onBestsellerChange(e.target.checked)}
              className="rounded border-border-default text-accent-primary focus:ring-accent-primary"
            />
            <span>Çok Satan (Bestseller)</span>
          </label>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface VariantTechnicalDetailsSectionProps {
  showAdvanced: boolean;
  onToggleShowAdvanced: () => void;
  variantName: string;
  onVariantNameChange: (val: string) => void;
  sku: string;
  onSkuChange: (val: string) => void;
  heightCm: string;
  onHeightCmChange: (val: string) => void;
  diameterCm: string;
  onDiameterCmChange: (val: string) => void;
  widthCm: string;
  onWidthCmChange: (val: string) => void;
  depthCm: string;
  onDepthCmChange: (val: string) => void;
  weightKg: string;
  onWeightKgChange: (val: string) => void;
  isAvailableForRetail: boolean;
  onIsAvailableForRetailChange: (val: boolean) => void;
  isAvailableForWholesale: boolean;
  onIsAvailableForWholesaleChange: (val: boolean) => void;
  active: boolean;
  onActiveChange: (val: boolean) => void;
}

export const VariantTechnicalDetailsSection: React.FC<VariantTechnicalDetailsSectionProps> = ({
  showAdvanced,
  onToggleShowAdvanced,
  variantName,
  onVariantNameChange,
  sku,
  onSkuChange,
  heightCm,
  onHeightCmChange,
  diameterCm,
  onDiameterCmChange,
  widthCm,
  onWidthCmChange,
  depthCm,
  onDepthCmChange,
  weightKg,
  onWeightKgChange,
  isAvailableForRetail,
  onIsAvailableForRetailChange,
  isAvailableForWholesale,
  onIsAvailableForWholesaleChange,
  active,
  onActiveChange,
}) => {
  return (
    <div className="pt-2 border-t border-border-subtle">
      <button
        type="button"
        onClick={onToggleShowAdvanced}
        className="flex items-center justify-between w-full py-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
      >
        <span className="flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-accent-primary" />
          <span>Kodlar ve Detaylı Ölçüler (İsteğe Bağlı)</span>
        </span>
        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showAdvanced && (
        <div className="mt-3 space-y-3 p-3 bg-surface-secondary/40 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="variant-name" className="block text-[11px] font-medium text-text-primary mb-1">
                Seçenek Başlığı
              </label>
              <input
                id="variant-name"
                type="text"
                value={variantName}
                onChange={(e) => onVariantNameChange(e.target.value)}
                placeholder="Örn: Mat Beyaz - Standart"
                className="w-full px-2.5 py-1.5 text-xs rounded bg-canvas-default border border-border-default text-text-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="variant-sku" className="block text-[11px] font-medium text-text-primary mb-1">
                Stok Kodu (SKU)
              </label>
              <input
                id="variant-sku"
                type="text"
                value={sku}
                onChange={(e) => onSkuChange(e.target.value.toUpperCase())}
                placeholder="Otomatik üretilir"
                className="w-full px-2.5 py-1.5 text-xs rounded bg-canvas-default border border-border-default text-text-primary font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <div>
              <label htmlFor="variant-height" className="block text-[10px] font-medium text-text-muted mb-1">
                Yükseklik (cm)
              </label>
              <input
                id="variant-height"
                type="number"
                step="0.1"
                value={heightCm}
                onChange={(e) => onHeightCmChange(e.target.value)}
                className="w-full px-2 py-1 text-xs rounded bg-canvas-default border border-border-default text-text-primary font-mono"
              />
            </div>
            <div>
              <label htmlFor="variant-diameter" className="block text-[10px] font-medium text-text-muted mb-1">
                Çap (cm)
              </label>
              <input
                id="variant-diameter"
                type="number"
                step="0.1"
                value={diameterCm}
                onChange={(e) => onDiameterCmChange(e.target.value)}
                className="w-full px-2 py-1 text-xs rounded bg-canvas-default border border-border-default text-text-primary font-mono"
              />
            </div>
            <div>
              <label htmlFor="variant-width" className="block text-[10px] font-medium text-text-muted mb-1">
                Genişlik (cm)
              </label>
              <input
                id="variant-width"
                type="number"
                step="0.1"
                value={widthCm}
                onChange={(e) => onWidthCmChange(e.target.value)}
                className="w-full px-2 py-1 text-xs rounded bg-canvas-default border border-border-default text-text-primary font-mono"
              />
            </div>
            <div>
              <label htmlFor="variant-depth" className="block text-[10px] font-medium text-text-muted mb-1">
                Derinlik (cm)
              </label>
              <input
                id="variant-depth"
                type="number"
                step="0.1"
                value={depthCm}
                onChange={(e) => onDepthCmChange(e.target.value)}
                className="w-full px-2 py-1 text-xs rounded bg-canvas-default border border-border-default text-text-primary font-mono"
              />
            </div>
            <div>
              <label htmlFor="variant-weight" className="block text-[10px] font-medium text-text-muted mb-1">
                Ağırlık (kg)
              </label>
              <input
                id="variant-weight"
                type="number"
                step="0.01"
                value={weightKg}
                onChange={(e) => onWeightKgChange(e.target.value)}
                className="w-full px-2 py-1 text-xs rounded bg-canvas-default border border-border-default text-text-primary font-mono"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-text-primary">
              <input
                type="checkbox"
                checked={isAvailableForRetail}
                onChange={(e) => onIsAvailableForRetailChange(e.target.checked)}
                className="rounded border-border-default text-accent-primary focus:ring-accent-primary"
              />
              <span>Perakende Satışa Açık</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-text-primary">
              <input
                type="checkbox"
                checked={isAvailableForWholesale}
                onChange={(e) => onIsAvailableForWholesaleChange(e.target.checked)}
                className="rounded border-border-default text-accent-primary focus:ring-accent-primary"
              />
              <span>Toptan Satışa Açık</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-text-primary">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => onActiveChange(e.target.checked)}
                className="rounded border-border-default text-accent-primary focus:ring-accent-primary"
              />
              <span>Aktif</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

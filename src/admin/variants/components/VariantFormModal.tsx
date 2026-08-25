import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/admin/ui';
import { adminVariantRepository } from '../api/admin-variant-repository';
import type { AdminProductVariant } from '../types';

interface VariantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productId: string;
  initialData?: AdminProductVariant | null;
}

export const VariantFormModal: React.FC<VariantFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  productId,
  initialData,
}) => {
  const { success, error: toastError } = useToast();
  const isEditing = Boolean(initialData);

  const [sku, setSku] = useState('');
  const [variantName, setVariantName] = useState('');
  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#2D3134');
  const [finish, setFinish] = useState('Mat Sırlı');
  const [sizeLabel, setSizeLabel] = useState('Standart');
  const [heightCm, setHeightCm] = useState('');
  const [diameterCm, setDiameterCm] = useState('');
  const [widthCm, setWidthCm] = useState('');
  const [depthCm, setDepthCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [retailPrice, setRetailPrice] = useState('0');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [isAvailableForRetail, setIsAvailableForRetail] = useState(true);
  const [isAvailableForWholesale, setIsAvailableForWholesale] = useState(true);
  const [sortOrder, setSortOrder] = useState('0');
  const [active, setActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setSku(initialData.sku);
      setVariantName(initialData.variant_name);
      setColorName(initialData.color_name);
      setColorHex(initialData.color_hex || '#2D3134');
      setFinish(initialData.finish || 'Mat Sırlı');
      setSizeLabel(initialData.size_label || 'Standart');
      setHeightCm(initialData.height_cm !== null ? String(initialData.height_cm) : '');
      setDiameterCm(initialData.diameter_cm !== null ? String(initialData.diameter_cm) : '');
      setWidthCm(initialData.width_cm !== null ? String(initialData.width_cm) : '');
      setDepthCm(initialData.depth_cm !== null ? String(initialData.depth_cm) : '');
      setWeightKg(initialData.weight_kg !== null ? String(initialData.weight_kg) : '');
      setRetailPrice(String(initialData.retail_price));
      setCompareAtPrice(initialData.compare_at_price !== null ? String(initialData.compare_at_price) : '');
      setStockQuantity(String(initialData.stock_quantity));
      setIsAvailableForRetail(initialData.is_available_for_retail);
      setIsAvailableForWholesale(initialData.is_available_for_wholesale);
      setSortOrder(String(initialData.sort_order || 0));
      setActive(initialData.active);
    } else {
      setSku('');
      setVariantName('');
      setColorName('');
      setColorHex('#2D3134');
      setFinish('Mat Sırlı');
      setSizeLabel('Standart');
      setHeightCm('');
      setDiameterCm('');
      setWidthCm('');
      setDepthCm('');
      setWeightKg('');
      setRetailPrice('0');
      setCompareAtPrice('');
      setStockQuantity('0');
      setIsAvailableForRetail(true);
      setIsAvailableForWholesale(true);
      setSortOrder('0');
      setActive(true);
    }
    setErrorMessage(null);
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedSku = sku.trim().toUpperCase();
    if (!trimmedSku) {
      setErrorMessage('SKU kodu zorunludur.');
      return;
    }

    const trimmedName = variantName.trim();
    if (!trimmedName) {
      setErrorMessage('Varyant adı zorunludur.');
      return;
    }

    const trimmedColor = colorName.trim();
    if (!trimmedColor) {
      setErrorMessage('Renk adı zorunludur.');
      return;
    }

    const numPrice = Number(retailPrice);
    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMessage('Perakende fiyatı geçerli bir pozitif sayı olmalıdır.');
      return;
    }

    const numStock = Number(stockQuantity);
    if (isNaN(numStock) || numStock < 0) {
      setErrorMessage('Stok adedi negatif olamaz.');
      return;
    }

    const numComparePrice = compareAtPrice ? Number(compareAtPrice) : null;
    if (numComparePrice !== null && numComparePrice < numPrice) {
      setErrorMessage('Eski fiyat mevcut perakende fiyatından düşük olamaz.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && initialData) {
        await adminVariantRepository.updateVariant(initialData.id, {
          sku: trimmedSku,
          variant_name: trimmedName,
          color_name: trimmedColor,
          color_hex: colorHex.trim() || null,
          finish: finish.trim() || null,
          size_label: sizeLabel.trim() || null,
          height_cm: heightCm ? Number(heightCm) : null,
          diameter_cm: diameterCm ? Number(diameterCm) : null,
          width_cm: widthCm ? Number(widthCm) : null,
          depth_cm: depthCm ? Number(depthCm) : null,
          weight_kg: weightKg ? Number(weightKg) : null,
          retail_price: numPrice,
          compare_at_price: numComparePrice,
          stock_quantity: Math.floor(numStock),
          is_available_for_retail: isAvailableForRetail,
          is_available_for_wholesale: isAvailableForWholesale,
          sort_order: Number(sortOrder) || 0,
          active,
        });

        success('Varyant Güncellendi', `"${trimmedSku}" başarıyla kaydedildi.`);
      } else {
        await adminVariantRepository.createVariant({
          product_id: productId,
          sku: trimmedSku,
          variant_name: trimmedName,
          color_name: trimmedColor,
          color_hex: colorHex.trim() || null,
          finish: finish.trim() || null,
          size_label: sizeLabel.trim() || null,
          height_cm: heightCm ? Number(heightCm) : null,
          diameter_cm: diameterCm ? Number(diameterCm) : null,
          width_cm: widthCm ? Number(widthCm) : null,
          depth_cm: depthCm ? Number(depthCm) : null,
          weight_kg: weightKg ? Number(weightKg) : null,
          retail_price: numPrice,
          compare_at_price: numComparePrice,
          stock_quantity: Math.floor(numStock),
          is_available_for_retail: isAvailableForRetail,
          is_available_for_wholesale: isAvailableForWholesale,
          sort_order: Number(sortOrder) || 0,
          active,
        });

        success('Varyant Oluşturuldu', `"${trimmedSku}" ürüne eklendi.`);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Varyant kaydedilirken bir hata oluştu.';
      setErrorMessage(msg);
      toastError('İşlem Başarısız', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="variant-modal-title"
    >
      <div className="bg-surface-primary border border-border-default shadow-elevated w-full max-w-xl max-h-[90vh] flex flex-col my-8 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-secondary/30">
          <div>
            <h2 id="variant-modal-title" className="font-serif text-base font-medium text-text-primary">
              {isEditing ? 'Varyantı Düzenle' : 'Yeni Varyant (SKU) Ekle'}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Renk, boyut, fiziksel ölçüler ve stok tanımları.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1.5 rounded transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3.5 bg-feedback-error/10 border border-feedback-error/20 rounded text-feedback-error text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="variant-sku" className="block text-xs font-medium text-text-primary mb-1">
                SKU Kodu <span className="text-status-danger">*</span>
              </label>
              <input
                id="variant-sku"
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="VAZO-ANF-01"
                className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-accent-primary"
                required
              />
            </div>

            <div>
              <label htmlFor="variant-name" className="block text-xs font-medium text-text-primary mb-1">
                Varyant Adı <span className="text-status-danger">*</span>
              </label>
              <input
                id="variant-name"
                type="text"
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
                placeholder="Mat Antrasit - Büyük Boy"
                className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="variant-color-name" className="block text-xs font-medium text-text-primary mb-1">
                Renk Adı <span className="text-status-danger">*</span>
              </label>
              <input
                id="variant-color-name"
                type="text"
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
                placeholder="Antrasit"
                className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                required
              />
            </div>

            <div>
              <label htmlFor="variant-color-hex" className="block text-xs font-medium text-text-primary mb-1">
                Renk Kodu (Hex)
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="w-8 h-8 rounded border border-border-default cursor-pointer p-0.5 bg-canvas-default shrink-0"
                />
                <input
                  id="variant-color-hex"
                  type="text"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>
            </div>

            <div>
              <label htmlFor="variant-size-label" className="block text-xs font-medium text-text-primary mb-1">
                Boyut Etiketi (Size Label)
              </label>
              <input
                id="variant-size-label"
                type="text"
                value={sizeLabel}
                onChange={(e) => setSizeLabel(e.target.value)}
                placeholder="Büyük Boy / L"
                className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div>
              <label htmlFor="variant-height" className="block text-[11px] font-medium text-text-primary mb-1">
                Yükseklik (cm)
              </label>
              <input
                id="variant-height"
                type="number"
                step="0.1"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="w-full px-2 py-1.5 text-xs rounded bg-canvas-default border border-border-default text-text-primary font-mono"
              />
            </div>
            <div>
              <label htmlFor="variant-diameter" className="block text-[11px] font-medium text-text-primary mb-1">
                Çap (cm)
              </label>
              <input
                id="variant-diameter"
                type="number"
                step="0.1"
                value={diameterCm}
                onChange={(e) => setDiameterCm(e.target.value)}
                className="w-full px-2 py-1.5 text-xs rounded bg-canvas-default border border-border-default text-text-primary font-mono"
              />
            </div>
            <div>
              <label htmlFor="variant-width" className="block text-[11px] font-medium text-text-primary mb-1">
                Genişlik (cm)
              </label>
              <input
                id="variant-width"
                type="number"
                step="0.1"
                value={widthCm}
                onChange={(e) => setWidthCm(e.target.value)}
                className="w-full px-2 py-1.5 text-xs rounded bg-canvas-default border border-border-default text-text-primary font-mono"
              />
            </div>
            <div>
              <label htmlFor="variant-depth" className="block text-[11px] font-medium text-text-primary mb-1">
                Derinlik (cm)
              </label>
              <input
                id="variant-depth"
                type="number"
                step="0.1"
                value={depthCm}
                onChange={(e) => setDepthCm(e.target.value)}
                className="w-full px-2 py-1.5 text-xs rounded bg-canvas-default border border-border-default text-text-primary font-mono"
              />
            </div>
            <div>
              <label htmlFor="variant-weight" className="block text-[11px] font-medium text-text-primary mb-1">
                Ağırlık (kg)
              </label>
              <input
                id="variant-weight"
                type="number"
                step="0.01"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full px-2 py-1.5 text-xs rounded bg-canvas-default border border-border-default text-text-primary font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="variant-price" className="block text-xs font-medium text-text-primary mb-1">
                Fiyat (₺) <span className="text-status-danger">*</span>
              </label>
              <input
                id="variant-price"
                type="number"
                step="0.01"
                min="0"
                value={retailPrice}
                onChange={(e) => setRetailPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-accent-primary"
                required
              />
            </div>

            <div>
              <label htmlFor="variant-compare-price" className="block text-xs font-medium text-text-primary mb-1">
                Eski Fiyat (₺)
              </label>
              <input
                id="variant-compare-price"
                type="number"
                step="0.01"
                min="0"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                placeholder="İndirim öncesi"
                className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
            </div>

            <div>
              <label htmlFor="variant-stock" className="block text-xs font-medium text-text-primary mb-1">
                Mevcut Stok <span className="text-status-danger">*</span>
              </label>
              <input
                id="variant-stock"
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-accent-primary"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-surface-secondary/40 rounded-md space-y-2">
            <span className="block text-xs font-semibold text-text-primary">Kanal ve Yayın Durumu</span>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-text-primary">
                <input
                  type="checkbox"
                  checked={isAvailableForRetail}
                  onChange={(e) => setIsAvailableForRetail(e.target.checked)}
                  className="rounded border-border-default text-accent-primary focus:ring-accent-primary"
                />
                <span>Perakende Satışa Açık</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-text-primary">
                <input
                  type="checkbox"
                  checked={isAvailableForWholesale}
                  onChange={(e) => setIsAvailableForWholesale(e.target.checked)}
                  className="rounded border-border-default text-accent-primary focus:ring-accent-primary"
                />
                <span>Toptan Satışa Açık</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-text-primary">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded border-border-default text-accent-primary focus:ring-accent-primary"
                />
                <span>Aktif Varyant</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 text-xs font-medium rounded border border-border-default bg-surface-primary hover:bg-surface-secondary text-text-primary transition-colors disabled:opacity-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3.5 py-1.5 text-xs font-medium rounded bg-accent-primary text-text-inverse hover:bg-accent-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditing ? 'Kaydet' : 'Varyant Ekle'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/admin/ui';
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap';
import { adminVariantRepository } from '../api/admin-variant-repository';
import { VariantTechnicalDetailsSection } from './VariantTechnicalDetailsSection';
import type { AdminProductVariant } from '../types';

interface VariantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productId: string;
  initialData?: AdminProductVariant | null;
  defaultRetailPrice?: string;
  productName?: string;
}

const COLOR_PRESETS = [
  { name: 'Mat Beyaz', hex: '#FDFBF7' },
  { name: 'Kum Beji', hex: '#D8CBB9' },
  { name: 'Terracotta', hex: '#C86D51' },
  { name: 'Mat Siyah', hex: '#2D3134' },
  { name: 'Zeytin Yeşili', hex: '#6B705C' },
  { name: 'Taş Grisi', hex: '#8E9296' },
];

export const VariantFormModal: React.FC<VariantFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  productId,
  initialData,
  defaultRetailPrice = '0',
  productName = '',
}) => {
  const { success, error: toastError } = useToast();
  const isEditing = Boolean(initialData);

  const { containerRef } = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });

  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#2D3134');
  const [sizeLabel, setSizeLabel] = useState('Standart');
  const [finish, setFinish] = useState('Mat Sırlı');
  const [retailPrice, setRetailPrice] = useState('0');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');

  // Auto/Advanced fields
  const [variantName, setVariantName] = useState('');
  const [isVariantNameManual, setIsVariantNameManual] = useState(false);
  const [sku, setSku] = useState('');
  const [isSkuManual, setIsSkuManual] = useState(false);

  // Optional dimensions & advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [heightCm, setHeightCm] = useState('');
  const [diameterCm, setDiameterCm] = useState('');
  const [widthCm, setWidthCm] = useState('');
  const [depthCm, setDepthCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [isAvailableForRetail, setIsAvailableForRetail] = useState(true);
  const [isAvailableForWholesale, setIsAvailableForWholesale] = useState(true);
  const [active, setActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or reset form
  useEffect(() => {
    if (initialData) {
      setColorName(initialData.color_name || '');
      setColorHex(initialData.color_hex || '#2D3134');
      setSizeLabel(initialData.size_label || 'Standart');
      setFinish(initialData.finish || 'Mat Sırlı');
      setRetailPrice(String(initialData.retail_price));
      setCompareAtPrice(initialData.compare_at_price !== null ? String(initialData.compare_at_price) : '');
      setStockQuantity(String(initialData.stock_quantity));
      setVariantName(initialData.variant_name || '');
      setIsVariantNameManual(true);
      setSku(initialData.sku || '');
      setIsSkuManual(true);
      setHeightCm(initialData.height_cm !== null ? String(initialData.height_cm) : '');
      setDiameterCm(initialData.diameter_cm !== null ? String(initialData.diameter_cm) : '');
      setWidthCm(initialData.width_cm !== null ? String(initialData.width_cm) : '');
      setDepthCm(initialData.depth_cm !== null ? String(initialData.depth_cm) : '');
      setWeightKg(initialData.weight_kg !== null ? String(initialData.weight_kg) : '');
      setIsAvailableForRetail(initialData.is_available_for_retail);
      setIsAvailableForWholesale(initialData.is_available_for_wholesale);
      setActive(initialData.active);
      setShowAdvanced(false);
    } else {
      setColorName('');
      setColorHex('#2D3134');
      setSizeLabel('Standart');
      setFinish('Mat Sırlı');
      setRetailPrice(defaultRetailPrice && Number(defaultRetailPrice) > 0 ? defaultRetailPrice : '0');
      setCompareAtPrice('');
      setStockQuantity('10');
      setVariantName('');
      setIsVariantNameManual(false);
      setSku('');
      setIsSkuManual(false);
      setHeightCm('');
      setDiameterCm('');
      setWidthCm('');
      setDepthCm('');
      setWeightKg('');
      setIsAvailableForRetail(true);
      setIsAvailableForWholesale(true);
      setActive(true);
      setShowAdvanced(false);
    }
    setErrorMessage(null);
  }, [initialData, isOpen, defaultRetailPrice]);

  const generateSku = (col: string, sz: string) => {
    const cleanColor = col
      .toUpperCase()
      .replace(/Ğ/g, 'G')
      .replace(/Ü/g, 'U')
      .replace(/Ş/g, 'S')
      .replace(/İ/g, 'I')
      .replace(/Ö/g, 'O')
      .replace(/Ç/g, 'C')
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 4) || 'RENK';

    const cleanSize = sz && sz !== 'Standart'
      ? sz.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3)
      : 'STD';

    const randSuffix = Math.floor(10 + Math.random() * 90);
    setSku(`VZ-${cleanColor}-${cleanSize}-${randSuffix}`);
  };

  const handleColorChange = (newColor: string) => {
    setColorName(newColor);
    if (!isVariantNameManual) {
      const generatedName = sizeLabel && sizeLabel !== 'Standart'
        ? `${newColor.trim()} - ${sizeLabel.trim()}`
        : newColor.trim();
      setVariantName(generatedName);
    }
    if (!isSkuManual) {
      generateSku(newColor, sizeLabel);
    }
  };

  const handleSizeChange = (newSize: string) => {
    setSizeLabel(newSize);
    if (!isVariantNameManual) {
      const generatedName = newSize && newSize !== 'Standart'
        ? `${colorName.trim() || 'Seçenek'} - ${newSize.trim()}`
        : (colorName.trim() || 'Standart');
      setVariantName(generatedName);
    }
    if (!isSkuManual) {
      generateSku(colorName, newSize);
    }
  };

  const handleSelectPreset = (preset: { name: string; hex: string }) => {
    setColorHex(preset.hex);
    handleColorChange(preset.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent parent modal submit and close
    setErrorMessage(null);

    const trimmedColor = colorName.trim();
    if (!trimmedColor) {
      setErrorMessage('Lütfen renk adını belirtiniz (Örn: Mat Beyaz).');
      return;
    }

    let finalName = variantName.trim();
    if (!finalName) {
      finalName = sizeLabel && sizeLabel !== 'Standart'
        ? `${trimmedColor} - ${sizeLabel.trim()}`
        : trimmedColor;
    }

    let finalSku = sku.trim().toUpperCase();
    if (!finalSku) {
      const cleanCol = trimmedColor.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'OPT';
      finalSku = `VZ-${cleanCol}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const numPrice = Number(retailPrice);
    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMessage('Geçerli bir satış fiyatı giriniz.');
      return;
    }

    const numStock = Number(stockQuantity);
    if (isNaN(numStock) || numStock < 0) {
      setErrorMessage('Stok adedi negatif olamaz.');
      return;
    }

    const numComparePrice = compareAtPrice ? Number(compareAtPrice) : null;
    if (numComparePrice !== null && numComparePrice < numPrice) {
      setErrorMessage('Eski fiyat mevcut satış fiyatından düşük olamaz.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && initialData) {
        await adminVariantRepository.updateVariant(initialData.id, {
          sku: finalSku,
          variant_name: finalName,
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
          sort_order: 0,
          active,
        });

        success('Renk / Seçenek Güncellendi', `"${trimmedColor}" başarıyla kaydedildi.`);
      } else {
        await adminVariantRepository.createVariant({
          product_id: productId,
          sku: finalSku,
          variant_name: finalName,
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
          sort_order: 0,
          active,
        });

        success('Yeni Renk / Seçenek Eklendi', `"${trimmedColor}" ürüne başarıyla eklendi.`);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kayıt sırasında bir hata oluştu.';
      setErrorMessage(msg);
      toastError('İşlem Başarısız', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="variant-modal-title"
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-primary border border-border-default shadow-elevated w-full max-w-lg max-h-[90vh] flex flex-col my-8 rounded-lg overflow-hidden focus:outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-secondary/30">
          <div>
            <h2 id="variant-modal-title" className="font-serif text-base font-medium text-text-primary">
              {isEditing ? 'Rengi / Seçeneği Düzenle' : 'Yeni Renk / Seçenek Ekle'}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              {productName ? `"${productName}" için renk ve stok tanımı.` : 'Ürüne ait renk, stok ve fiyat tanımları.'}
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

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 bg-feedback-error/10 border border-feedback-error/20 rounded text-feedback-error text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Color Presets */}
          <div>
            <span className="block text-[11px] font-medium text-text-muted mb-1.5">
              Hızlı Renk Önerileri
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-border-subtle bg-surface-secondary/60 hover:bg-surface-secondary text-text-primary text-[11px] transition-colors"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: p.hex }}
                  />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Name & Color Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="variant-color-name" className="block text-xs font-medium text-text-primary mb-1">
                Renk Adı <span className="text-status-danger">*</span>
              </label>
              <input
                id="variant-color-name"
                type="text"
                value={colorName}
                onChange={(e) => handleColorChange(e.target.value)}
                placeholder="Örn: Mat Beyaz, Bej, Terracotta"
                className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                required
              />
            </div>

            <div>
              <label htmlFor="variant-color-hex" className="block text-xs font-medium text-text-primary mb-1">
                Renk Tonu
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="w-8 h-8 rounded border border-border-default cursor-pointer p-0.5 bg-canvas-default shrink-0"
                  title="Renk seçici"
                />
                <input
                  id="variant-color-hex"
                  type="text"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>
            </div>
          </div>

          {/* Size & Surface Finish */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="variant-size-label" className="block text-xs font-medium text-text-primary mb-1">
                Boyut / Ebat
              </label>
              <input
                id="variant-size-label"
                type="text"
                value={sizeLabel}
                onChange={(e) => handleSizeChange(e.target.value)}
                placeholder="Standart, Büyük Boy (L), 25 cm vb."
                className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
            </div>

            <div>
              <label htmlFor="variant-finish" className="block text-xs font-medium text-text-primary mb-1">
                Yüzey Dokusu (Bitiş)
              </label>
              <input
                id="variant-finish"
                type="text"
                value={finish}
                onChange={(e) => setFinish(e.target.value)}
                placeholder="Mat Sırlı, Parlak Sırlı, Dokulu"
                className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
            </div>
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="variant-price" className="block text-xs font-medium text-text-primary mb-1">
                Satış Fiyatı (₺) <span className="text-status-danger">*</span>
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
                placeholder="İndirim öncesi (opsiyonel)"
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

          {/* Collapsible Advanced / Technical Section */}
          <VariantTechnicalDetailsSection
            showAdvanced={showAdvanced}
            onToggleShowAdvanced={() => setShowAdvanced(!showAdvanced)}
            variantName={variantName}
            onVariantNameChange={(val) => {
              setIsVariantNameManual(true);
              setVariantName(val);
            }}
            sku={sku}
            onSkuChange={(val) => {
              setIsSkuManual(true);
              setSku(val);
            }}
            heightCm={heightCm}
            onHeightCmChange={setHeightCm}
            diameterCm={diameterCm}
            onDiameterCmChange={setDiameterCm}
            widthCm={widthCm}
            onWidthCmChange={setWidthCm}
            depthCm={depthCm}
            onDepthCmChange={setDepthCm}
            weightKg={weightKg}
            onWeightKgChange={setWeightKg}
            isAvailableForRetail={isAvailableForRetail}
            onIsAvailableForRetailChange={setIsAvailableForRetail}
            isAvailableForWholesale={isAvailableForWholesale}
            onIsAvailableForWholesaleChange={setIsAvailableForWholesale}
            active={active}
            onActiveChange={setActive}
          />

          {/* Action Buttons */}
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
              className="px-4 py-1.5 text-xs font-medium rounded bg-accent-primary text-text-inverse hover:bg-accent-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditing ? 'Değişiklikleri Kaydet' : 'Rengi / Seçeneği Ekle'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

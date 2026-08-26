import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/admin/ui';
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap';
import { adminPricingRepository } from '../api/admin-pricing-repository';
import type { AdminPricingItem } from '../types';

interface PriceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: AdminPricingItem | null;
}

export const PriceEditModal: React.FC<PriceEditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  item,
}) => {
  const { success, error: toastError } = useToast();

  const { containerRef } = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });

  const [retailPrice, setRetailPrice] = useState('0');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setRetailPrice(String(item.retailPrice));
      setCompareAtPrice(item.compareAtPrice !== null ? String(item.compareAtPrice) : '');
      setErrorMessage(null);
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    const price = Number(retailPrice);
    if (isNaN(price) || price < 0) {
      setErrorMessage('Geçerli bir pozitif satış fiyatı giriniz.');
      return;
    }

    const comparePrice = compareAtPrice ? Number(compareAtPrice) : null;
    if (comparePrice !== null && comparePrice < price) {
      setErrorMessage('Eski fiyat (indirim öncesi) mevcut satış fiyatından düşük olamaz.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await adminPricingRepository.updatePrice({
        id: item.id,
        type: item.type,
        retailPrice: price,
        compareAtPrice: comparePrice,
      });

      success('Fiyat Güncellendi', `"${item.name}" fiyatı başarıyla kaydedildi.`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fiyat güncellenemedi.';
      setErrorMessage(msg);
      toastError('Hata', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="price-modal-title"
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className="bg-surface-primary border border-border-default shadow-elevated w-full max-w-md rounded-lg overflow-hidden flex flex-col focus:outline-none"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-secondary/30">
          <div>
            <h2 id="price-modal-title" className="font-serif text-base font-medium text-text-primary">
              Fiyatı Düzenle
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              {item.type === 'product' ? 'Ana Ürün Fiyatı' : `Varyant: ${item.sku}`}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 bg-feedback-error/10 border border-feedback-error/20 rounded text-feedback-error text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="p-3 bg-surface-secondary/50 rounded border border-border-subtle text-xs space-y-1">
            <span className="text-text-secondary block">Ürün / Başlık</span>
            <span className="font-semibold text-text-primary block">{item.name}</span>
            <span className="text-[11px] text-text-muted block">{item.categoryName}</span>
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="price-retail" className="block text-xs font-medium text-text-primary mb-1">
                Satış Fiyatı (₺) <span className="text-status-danger">*</span>
              </label>
              <input
                id="price-retail"
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
              <label htmlFor="price-compare" className="block text-xs font-medium text-text-primary mb-1">
                Eski Fiyat / Üstü Çizili (₺)
              </label>
              <input
                id="price-compare"
                type="number"
                step="0.01"
                min="0"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                placeholder="İsteğe bağlı indirim öncesi fiyat"
                className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium rounded border border-border-default bg-surface-primary hover:bg-surface-secondary text-text-primary transition-colors disabled:opacity-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium rounded bg-accent-primary text-text-inverse hover:bg-accent-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Fiyatı Kaydet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

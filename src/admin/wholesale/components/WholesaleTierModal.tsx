import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/admin/ui';
import { adminWholesaleRepository } from '../api/admin-wholesale-repository';
import type { AdminWholesaleTier } from '../types';
import type { AdminProduct } from '@/admin/products/types';

interface WholesaleTierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: AdminProduct[];
  tier?: AdminWholesaleTier | null;
}

export const WholesaleTierModal: React.FC<WholesaleTierModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  products,
  tier,
}) => {
  const { success, error: toastError } = useToast();
  const isEditing = Boolean(tier);

  const [productId, setProductId] = useState('');
  const [minQuantity, setMinQuantity] = useState('10');
  const [maxQuantity, setMaxQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('0');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [active, setActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (tier) {
      setProductId(tier.product_id);
      setMinQuantity(String(tier.min_quantity));
      setMaxQuantity(tier.max_quantity !== null ? String(tier.max_quantity) : '');
      setUnitPrice(String(tier.unit_price));
      setDiscountPercentage(tier.discount_percentage !== null ? String(tier.discount_percentage) : '');
      setActive(tier.active);
    } else {
      setProductId(products[0]?.id || '');
      setMinQuantity('10');
      setMaxQuantity('');
      setUnitPrice('0');
      setDiscountPercentage('');
      setActive(true);
    }
    setErrorMessage(null);
  }, [tier, isOpen, products]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!productId) {
      setErrorMessage('Lütfen bir ürün seçiniz.');
      return;
    }

    const min = Number(minQuantity);
    if (isNaN(min) || min < 1) {
      setErrorMessage('Minimum adet en az 1 olmalıdır.');
      return;
    }

    const max = maxQuantity ? Number(maxQuantity) : null;
    if (max !== null && max < min) {
      setErrorMessage('Maksimum adet minimum adetten küçük olamaz.');
      return;
    }

    const price = Number(unitPrice);
    if (isNaN(price) || price < 0) {
      setErrorMessage('Birim toptan fiyat geçerli bir pozitif sayı olmalıdır.');
      return;
    }

    const discount = discountPercentage ? Number(discountPercentage) : null;
    if (discount !== null && (discount < 0 || discount > 100)) {
      setErrorMessage('İndirim yüzdesi 0 ile 100 arasında olmalıdır.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && tier) {
        await adminWholesaleRepository.updateWholesaleTier(tier.id, {
          min_quantity: min,
          max_quantity: max,
          unit_price: price,
          discount_percentage: discount,
          active,
        });
        success('Kademe Güncellendi', 'Toptan fiyat kademesi başarıyla güncellendi.');
      } else {
        await adminWholesaleRepository.createWholesaleTier({
          product_id: productId,
          min_quantity: min,
          max_quantity: max,
          unit_price: price,
          discount_percentage: discount,
          active,
        });
        success('Kademe Oluşturuldu', 'Yeni toptan fiyat kademesi eklendi.');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Toptan kademe kaydedilemedi.';
      setErrorMessage(msg);
      toastError('İşlem Başarısız', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tier-modal-title"
    >
      <div className="bg-surface-primary border border-border-default shadow-elevated w-full max-w-md rounded-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-secondary/30">
          <div>
            <h2 id="tier-modal-title" className="font-serif text-base font-medium text-text-primary">
              {isEditing ? 'Toptan Fiyat Kademesini Düzenle' : 'Yeni Toptan Fiyat Kademesi Ekle'}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Hacimli siparişler için indirimli birim fiyat ve miktar aralığı.
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

          <div>
            <label htmlFor="tier-product" className="block text-xs font-medium text-text-primary mb-1">
              Bağlı Ürün <span className="text-status-danger">*</span>
            </label>
            <select
              id="tier-product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              disabled={isEditing}
              className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary disabled:opacity-50"
              required
            >
              <option value="" disabled>Ürün seçiniz</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="tier-min-qty" className="block text-xs font-medium text-text-primary mb-1">
                Min. Adet <span className="text-status-danger">*</span>
              </label>
              <input
                id="tier-min-qty"
                type="number"
                min="1"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-accent-primary"
                required
              />
            </div>

            <div>
              <label htmlFor="tier-max-qty" className="block text-xs font-medium text-text-primary mb-1">
                Maks. Adet (Boş = Sınırsız)
              </label>
              <input
                id="tier-max-qty"
                type="number"
                min="1"
                value={maxQuantity}
                onChange={(e) => setMaxQuantity(e.target.value)}
                placeholder="Örn: 50"
                className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="tier-price" className="block text-xs font-medium text-text-primary mb-1">
                Birim Fiyat (₺) <span className="text-status-danger">*</span>
              </label>
              <input
                id="tier-price"
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-accent-primary"
                required
              />
            </div>

            <div>
              <label htmlFor="tier-discount" className="block text-xs font-medium text-text-primary mb-1">
                İndirim Yüzdesi (%)
              </label>
              <input
                id="tier-discount"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(e.target.value)}
                placeholder="Örn: 25"
                className="w-full px-3 py-2 text-xs rounded-md bg-canvas-default border border-border-default text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-text-primary">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded border-border-default text-accent-primary focus:ring-accent-primary"
              />
              <span>Kademe Aktif</span>
            </label>
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
              <span>{isEditing ? 'Kaydet' : 'Kademeyi Ekle'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Plus, Minus } from 'lucide-react';
import { useToast } from '@/admin/ui';
import { adminInventoryRepository } from '../api/admin-inventory-repository';
import type { AdminInventoryItem } from '../types';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: AdminInventoryItem | null;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  item,
}) => {
  const { success, error: toastError } = useToast();
  const [stockValue, setStockValue] = useState<string>('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setStockValue(String(item.stock_quantity));
      setErrorMessage(null);
    }
  }, [item, isOpen]);

  const handleAdjust = (delta: number) => {
    const current = Number(stockValue) || 0;
    const updated = Math.max(0, current + delta);
    setStockValue(String(updated));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    const qty = Number(stockValue);
    if (isNaN(qty) || qty < 0) {
      setErrorMessage('Stok miktarı sıfır veya daha büyük bir tam sayı olmalıdır.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await adminInventoryRepository.updateStock(item.id, qty);
      success('Stok Güncellendi', `"${item.sku}" stok adedi ${qty} olarak ayarlandı.`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Stok güncellenemedi.';
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
      aria-labelledby="stock-modal-title"
    >
      <div className="bg-surface-primary border border-border-default shadow-elevated w-full max-w-md rounded-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-secondary/30">
          <div>
            <h2 id="stock-modal-title" className="font-serif text-base font-medium text-text-primary">
              Stok Miktarını Güncelle
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              {item.product_name} — <span className="font-mono font-semibold">{item.sku}</span>
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

          <div className="bg-surface-secondary/50 p-3.5 rounded-lg border border-border-subtle flex items-center justify-between text-xs">
            <div>
              <span className="text-text-secondary block">Varyant</span>
              <span className="font-medium text-text-primary">{item.variant_name}</span>
            </div>
            <div className="text-right">
              <span className="text-text-secondary block">Mevcut Stok</span>
              <span className="font-mono font-bold text-text-primary">{item.stock_quantity} Adet</span>
            </div>
          </div>

          <div>
            <label htmlFor="target-stock" className="block text-xs font-medium text-text-primary mb-1.5">
              Yeni Stok Adedi
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAdjust(-10)}
                className="px-2.5 py-2 text-xs font-mono rounded border border-border-default hover:bg-surface-secondary text-text-secondary"
                title="-10"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => handleAdjust(-1)}
                className="p-2 rounded border border-border-default hover:bg-surface-secondary text-text-secondary"
                title="-1"
              >
                <Minus className="w-4 h-4" />
              </button>

              <input
                id="target-stock"
                type="number"
                min="0"
                value={stockValue}
                onChange={(e) => setStockValue(e.target.value)}
                className="w-full text-center py-2 px-3 text-sm font-mono font-semibold rounded-md bg-canvas-default border border-border-default text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                required
              />

              <button
                type="button"
                onClick={() => handleAdjust(1)}
                className="p-2 rounded border border-border-default hover:bg-surface-secondary text-text-secondary"
                title="+1"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleAdjust(10)}
                className="px-2.5 py-2 text-xs font-mono rounded border border-border-default hover:bg-surface-secondary text-text-secondary"
                title="+10"
              >
                +10
              </button>
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
              <span>Stoku Kaydet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

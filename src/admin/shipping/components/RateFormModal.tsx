import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  ShippingRate,
  CreateShippingRateInput,
  UpdateShippingRateInput,
  CurrencyCode,
} from '@/entities/shipping/types';
import { toMinorUnits, fromMinorUnits } from '@/shared/lib/money';

interface RateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  zoneName: string;
  rateToEdit: ShippingRate | null;
  onSave: (input: CreateShippingRateInput | UpdateShippingRateInput, rateId?: string) => Promise<void>;
}

export const RateFormModal: React.FC<RateFormModalProps> = ({
  isOpen,
  onClose,
  zoneName,
  rateToEdit,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('TRY');
  const [flatAmount, setFlatAmount] = useState<string>('150');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<string>('5000');
  const [minOrder, setMinOrder] = useState<string>('');
  const [maxOrder, setMaxOrder] = useState<string>('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [priority, setPriority] = useState<number>(10);
  const [active, setActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (rateToEdit) {
      setName(rateToEdit.name || '');
      setCurrency(rateToEdit.currency || 'TRY');
      setFlatAmount(String(fromMinorUnits(rateToEdit.flat_amount_minor)));
      setFreeShippingThreshold(
        rateToEdit.free_shipping_threshold_minor != null
          ? String(fromMinorUnits(rateToEdit.free_shipping_threshold_minor))
          : ''
      );
      setMinOrder(
        rateToEdit.minimum_order_minor != null
          ? String(fromMinorUnits(rateToEdit.minimum_order_minor))
          : ''
      );
      setMaxOrder(
        rateToEdit.maximum_order_minor != null
          ? String(fromMinorUnits(rateToEdit.maximum_order_minor))
          : ''
      );
      setEstimatedDelivery(rateToEdit.estimated_delivery_text || '');
      setPriority(rateToEdit.priority || 0);
      setActive(rateToEdit.active !== false);
    } else {
      setName('Standart Kargo');
      setCurrency('TRY');
      setFlatAmount('150');
      setFreeShippingThreshold('5000');
      setMinOrder('');
      setMaxOrder('');
      setEstimatedDelivery('2-4 İş Günü');
      setPriority(10);
      setActive(true);
    }
    setErrorMessage(null);
  }, [rateToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Lütfen tarife adını giriniz.');
      return;
    }

    const flatMinor = toMinorUnits(Number(flatAmount));
    if (flatMinor < 0) {
      setErrorMessage('Kargo ücreti negatif olamaz.');
      return;
    }

    const freeThreshMinor =
      freeShippingThreshold.trim() !== '' ? toMinorUnits(Number(freeShippingThreshold)) : null;
    const minMinor = minOrder.trim() !== '' ? toMinorUnits(Number(minOrder)) : null;
    const maxMinor = maxOrder.trim() !== '' ? toMinorUnits(Number(maxOrder)) : null;

    if (minMinor != null && maxMinor != null && maxMinor < minMinor) {
      setErrorMessage('Maksimum sipariş tutarı minimum tutardan küçük olamaz.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onSave(
        {
          name: name.trim(),
          currency,
          flat_amount_minor: flatMinor,
          free_shipping_threshold_minor: freeThreshMinor,
          minimum_order_minor: minMinor,
          maximum_order_minor: maxMinor,
          estimated_delivery_text: estimatedDelivery.trim() || null,
          priority: Number(priority) || 0,
          active,
        },
        rateToEdit?.id
      );
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Tarife kaydedilirken hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-label={rateToEdit ? 'Kargo Tarifesini Düzenle' : 'Yeni Kargo Tarifesi'}
        className="relative w-full max-w-lg bg-surface-primary border border-border-default shadow-elevated z-10 p-6 animate-fade-scale text-left max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-border-subtle pb-4 mb-5">
          <div>
            <h2 className="font-display text-lg text-text-primary font-medium">
              {rateToEdit ? 'Kargo Tarifesini Düzenle' : 'Yeni Kargo Tarifesi Ekle'}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">{zoneName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="p-1.5 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 text-xs bg-feedback-danger-surface text-feedback-danger border border-feedback-danger/20 rounded">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1 col-span-2">
              <label className="block text-xs font-medium text-text-primary">Tarife Adı *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Standart Yurtiçi Kargo, Hızlı Kurye"
                className="w-full px-3.5 py-2 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary"
              />
            </div>
            <div className="space-y-1 col-span-1">
              <label className="block text-xs font-medium text-text-primary">Para Birimi</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full px-3.5 py-2 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary"
              >
                <option value="TRY">TRY (₺)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-text-primary">Sabit Kargo Ücreti *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={flatAmount}
                onChange={(e) => setFlatAmount(e.target.value)}
                placeholder="150.00"
                className="w-full px-3.5 py-2 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-text-secondary">Ücretsiz Kargo Limiti</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
                placeholder="5000.00 (Opsiyonel)"
                className="w-full px-3.5 py-2 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-text-secondary">Min. Sipariş Tutarı</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                placeholder="0.00 (Opsiyonel)"
                className="w-full px-3.5 py-2 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-text-secondary">Maks. Sipariş Tutarı</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={maxOrder}
                onChange={(e) => setMaxOrder(e.target.value)}
                placeholder="Limitsiz (Opsiyonel)"
                className="w-full px-3.5 py-2 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1 col-span-2">
              <label className="block text-xs font-medium text-text-secondary">Tahmini Teslimat Süresi</label>
              <input
                type="text"
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
                placeholder="Örn: 2–4 İş Günü"
                className="w-full px-3.5 py-2 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary"
              />
            </div>
            <div className="space-y-1 col-span-1">
              <label className="block text-xs font-medium text-text-primary">Öncelik</label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value) || 0)}
                className="w-full px-3.5 py-2 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-text-primary pt-2">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded border-border-default text-text-primary focus:ring-0"
            />
            <span>Bu Tarife Aktif</span>
          </label>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-action-primary text-action-primary-text text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Kaydediliyor...' : rateToEdit ? 'Güncelle' : 'Tarifeyi Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

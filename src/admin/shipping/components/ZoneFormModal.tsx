import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ShippingZone, CreateShippingZoneInput, UpdateShippingZoneInput } from '@/entities/shipping/types';

interface ZoneFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  zoneToEdit: ShippingZone | null;
  onSave: (input: CreateShippingZoneInput | UpdateShippingZoneInput, id?: string) => Promise<void>;
}

export const ZoneFormModal: React.FC<ZoneFormModalProps> = ({
  isOpen,
  onClose,
  zoneToEdit,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(0);
  const [active, setActive] = useState(true);
  const [retailEnabled, setRetailEnabled] = useState(true);
  const [wholesaleEnabled, setWholesaleEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (zoneToEdit) {
      setName(zoneToEdit.name || '');
      setDescription(zoneToEdit.description || '');
      setPriority(zoneToEdit.priority || 0);
      setActive(zoneToEdit.active !== false);
      setRetailEnabled(zoneToEdit.retail_enabled !== false);
      setWholesaleEnabled(Boolean(zoneToEdit.wholesale_enabled));
    } else {
      setName('');
      setDescription('');
      setPriority(0);
      setActive(true);
      setRetailEnabled(true);
      setWholesaleEnabled(false);
    }
    setErrorMessage(null);
  }, [zoneToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Lütfen bir bölge adı giriniz.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onSave(
        {
          name: name.trim(),
          description: description.trim() || null,
          priority: Number(priority) || 0,
          active,
          retail_enabled: retailEnabled,
          wholesale_enabled: wholesaleEnabled,
        },
        zoneToEdit?.id
      );
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Bölge kaydedilirken hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-label={zoneToEdit ? 'Bölgeyi Düzenle' : 'Yeni Kargo Bölgesi'}
        className="relative w-full max-w-lg bg-surface-primary border border-border-default shadow-elevated z-10 p-6 animate-fade-scale text-left"
      >
        <div className="flex items-center justify-between border-b border-border-subtle pb-4 mb-5">
          <h2 className="font-display text-lg text-text-primary font-medium">
            {zoneToEdit ? 'Kargo Bölgesini Düzenle' : 'Yeni Kargo Bölgesi Ekle'}
          </h2>
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
          <div className="space-y-1">
            <label className="block text-xs font-medium text-text-primary">Bölge Adı *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Türkiye İçi, Avrupa Bölgesi"
              className="w-full px-3.5 py-2 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-text-secondary">Açıklama (İsteğe Bağlı)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Örn: Tüm Türkiye geneli teslimatlar"
              className="w-full px-3.5 py-2 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-text-primary">Öncelik Sırası (Priority)</label>
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value) || 0)}
              className="w-full px-3.5 py-2 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary"
            />
            <p className="text-[10px] text-text-muted">Yüksek öncelikli bölgeler çakışmalarda önce değerlendirilir.</p>
          </div>

          <div className="pt-2 border-t border-border-subtle space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-text-primary">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded border-border-default text-text-primary focus:ring-0"
              />
              <span>Bölge Aktif</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-text-primary">
              <input
                type="checkbox"
                checked={retailEnabled}
                onChange={(e) => setRetailEnabled(e.target.checked)}
                className="rounded border-border-default text-text-primary focus:ring-0"
              />
              <span>Perakende (B2C) Müşterilerine Açık</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-text-primary">
              <input
                type="checkbox"
                checked={wholesaleEnabled}
                onChange={(e) => setWholesaleEnabled(e.target.checked)}
                className="rounded border-border-default text-text-primary focus:ring-0"
              />
              <span>Toptan / Kurumsal (B2B) Müşterilerine Açık</span>
            </label>
          </div>

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
              {isSubmitting ? 'Kaydediliyor...' : zoneToEdit ? 'Güncelle' : 'Bölgeyi Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

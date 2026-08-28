import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CreateShippingCountryInput } from '@/entities/shipping/types';

interface CountryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  zoneName: string;
  onSave: (input: CreateShippingCountryInput) => Promise<void>;
}

const COMMON_COUNTRIES = [
  { code: 'TR', name: 'Türkiye' },
  { code: 'DE', name: 'Almanya' },
  { code: 'GB', name: 'Birleşik Krallık' },
  { code: 'US', name: 'Amerika Birleşik Devletleri' },
  { code: 'FR', name: 'Fransa' },
  { code: 'IT', name: 'İtalya' },
  { code: 'NL', name: 'Hollanda' },
  { code: 'AE', name: 'Birleşik Arap Emirlikleri' },
  { code: 'SA', name: 'Suudi Arabistan' },
  { code: 'AZ', name: 'Azerbaycan' },
  { code: 'CA', name: 'Kanada' },
  { code: 'CH', name: 'İsviçre' },
  { code: 'AT', name: 'Avusturya' },
  { code: 'BE', name: 'Belçika' },
  { code: 'ES', name: 'İspanya' },
];

export const CountryFormModal: React.FC<CountryFormModalProps> = ({
  isOpen,
  onClose,
  zoneName,
  onSave,
}) => {
  const [countryCode, setCountryCode] = useState('TR');
  const [countryName, setCountryName] = useState('Türkiye');
  const [active, setActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setCountryCode('TR');
    setCountryName('Türkiye');
    setActive(true);
    setErrorMessage(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPredefined = (code: string) => {
    const found = COMMON_COUNTRIES.find((c) => c.code === code);
    if (found) {
      setCountryCode(found.code);
      setCountryName(found.name);
    } else {
      setCountryCode(code);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = countryCode.trim().toUpperCase();
    const name = countryName.trim();

    if (code.length !== 2) {
      setErrorMessage('Ülke kodu 2 haneli ISO-2 formatında olmalıdır (Örn: TR, DE, US).');
      return;
    }
    if (!name) {
      setErrorMessage('Lütfen ülke adını giriniz.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onSave({
        country_code: code,
        country_name: name,
        active,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Ülke eklenirken hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-label="Bölgeye Ülke Ekle"
        className="relative w-full max-w-md bg-surface-primary border border-border-default shadow-elevated z-10 p-6 animate-fade-scale text-left"
      >
        <div className="flex items-center justify-between border-b border-border-subtle pb-4 mb-5">
          <div>
            <h2 className="font-display text-lg text-text-primary font-medium">Bölgeye Ülke Ekle</h2>
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
          <div className="space-y-1">
            <label className="block text-xs font-medium text-text-primary">Hızlı Ülke Seçimi</label>
            <select
              value={countryCode}
              onChange={(e) => handleSelectPredefined(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary"
            >
              {COMMON_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1 col-span-1">
              <label className="block text-xs font-medium text-text-primary">ISO Kodu *</label>
              <input
                type="text"
                required
                maxLength={2}
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                placeholder="TR"
                className="w-full px-3.5 py-2 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary uppercase"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <label className="block text-xs font-medium text-text-primary">Ülke Adı *</label>
              <input
                type="text"
                required
                value={countryName}
                onChange={(e) => setCountryName(e.target.value)}
                placeholder="Türkiye"
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
            <span>Bu Ülke İçin Gönderim Aktif</span>
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
              {isSubmitting ? 'Ekleniyor...' : 'Ülkeyi Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

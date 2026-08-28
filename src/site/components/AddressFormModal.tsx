import { useState, useEffect, useRef, type FormEvent } from 'react';
import { X, AlertCircle, Check, LoaderCircle } from 'lucide-react';
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap';
import type { CustomerAddress, CreateAddressInput, UpdateAddressInput } from '@/entities/customer/types';

export interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  addressToEdit?: CustomerAddress | null;
  onSave: (input: CreateAddressInput | UpdateAddressInput, addressId?: string) => Promise<void>;
}

const COUNTRIES = [
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
];

export function AddressFormModal({
  isOpen,
  onClose,
  addressToEdit,
  onSave,
}: AddressFormModalProps) {
  const isEditing = Boolean(addressToEdit);

  const [label, setLabel] = useState('Ev');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [countryCode, setCountryCode] = useState('TR');
  const [countryName, setCountryName] = useState('Türkiye');
  const [isDefaultShipping, setIsDefaultShipping] = useState(false);
  const [isDefaultBilling, setIsDefaultBilling] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { containerRef } = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });

  useEffect(() => {
    if (isOpen) {
      if (addressToEdit) {
        setLabel(addressToEdit.label || 'Ev');
        setRecipientName(addressToEdit.recipient_name || '');
        setPhone(addressToEdit.phone || '');
        setAddressLine1(addressToEdit.address_line1 || '');
        setAddressLine2(addressToEdit.address_line2 || '');
        setDistrict(addressToEdit.district || '');
        setCity(addressToEdit.city || '');
        setStateProvince(addressToEdit.state_province || '');
        setPostalCode(addressToEdit.postal_code || '');
        setCountryCode(addressToEdit.country_code || 'TR');
        setCountryName(addressToEdit.country_name || 'Türkiye');
        setIsDefaultShipping(Boolean(addressToEdit.is_default_shipping));
        setIsDefaultBilling(Boolean(addressToEdit.is_default_billing));
      } else {
        setLabel('Ev');
        setRecipientName('');
        setPhone('');
        setAddressLine1('');
        setAddressLine2('');
        setDistrict('');
        setCity('');
        setStateProvince('');
        setPostalCode('');
        setCountryCode('TR');
        setCountryName('Türkiye');
        setIsDefaultShipping(false);
        setIsDefaultBilling(false);
      }
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, addressToEdit]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    const found = COUNTRIES.find((c) => c.code === code);
    setCountryName(found ? found.name : code);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!recipientName.trim()) {
      setError('Lütfen alıcı ad ve soyadını giriniz.');
      return;
    }
    if (!phone.trim()) {
      setError('Lütfen iletişim telefonunu giriniz.');
      return;
    }
    if (!addressLine1.trim()) {
      setError('Lütfen açık adres bilgisini giriniz.');
      return;
    }
    if (!city.trim()) {
      setError('Lütfen şehir giriniz.');
      return;
    }
    if (!postalCode.trim()) {
      setError('Lütfen posta kodunu giriniz.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreateAddressInput = {
        label: label.trim() || 'Ev',
        recipient_name: recipientName.trim(),
        phone: phone.trim(),
        address_line1: addressLine1.trim(),
        address_line2: addressLine2.trim() || null,
        district: district.trim() || null,
        city: city.trim(),
        state_province: stateProvince.trim() || null,
        postal_code: postalCode.trim(),
        country_code: countryCode.trim().toUpperCase(),
        country_name: countryName.trim(),
        is_default_shipping: isDefaultShipping,
        is_default_billing: isDefaultBilling,
      };

      await onSave(payload, addressToEdit?.id);
      setSuccess(true);
      timerRef.current = setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Adres kaydedilirken hata oluştu.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      {/* Modal Card */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-surface-primary border border-border-default shadow-elevated z-10 p-6 sm:p-8 animate-fade-scale text-left"
      >
        <button
          onClick={onClose}
          aria-label="Kapat"
          className="absolute top-5 right-5 p-1.5 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-5">
          <div className="space-y-1">
            <span className="text-[11px] uppercase font-semibold tracking-editorial text-text-secondary">
              Adres Yönetimi
            </span>
            <h3 className="font-display text-2xl text-text-primary">
              {isEditing ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}
            </h3>
            <p className="text-xs text-text-secondary">
              Teslimat ve fatura adres bilgilerinizi giriniz.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-feedback-danger-surface text-feedback-danger text-xs flex items-center gap-2 border border-feedback-danger/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-feedback-success-surface text-feedback-success text-xs flex items-center gap-2 border border-feedback-success/20">
              <Check className="w-4 h-4 shrink-0" />
              <span>Adres başarıyla kaydedildi.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Label & Recipient Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-text-primary">
                  Adres Başlığı *
                </label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Örn: Ev, Ofis, Atölye"
                  className="w-full px-3.5 py-2 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-text-primary">
                  Alıcı Adı Soyadı *
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Ad Soyad"
                  className="w-full px-3.5 py-2 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary"
                />
              </div>
            </div>

            {/* Phone & Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-text-primary">
                  Telefon Numarası *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0555 123 45 67"
                  className="w-full px-3.5 py-2 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-text-primary">
                  Ülke *
                </label>
                <select
                  value={countryCode}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address Line 1 */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-text-primary">
                Açık Adres (Cadde, Sokak, No, Daire) *
              </label>
              <textarea
                required
                rows={2}
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="Mahalle, Cadde, Bina No, Kapı No"
                className="w-full px-3.5 py-2 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary resize-none"
              />
            </div>

            {/* Address Line 2 */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-text-secondary">
                Adres Tarifi / Ek Bilgi (İsteğe Bağlı)
              </label>
              <input
                type="text"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="Örn: Kat 3, Güvenlik yanı"
                className="w-full px-3.5 py-2 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary"
              />
            </div>

            {/* City, District, Postal Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-text-primary">Şehir *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="İstanbul"
                  className="w-full px-3.5 py-2 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-text-primary">İlçe / Bölge</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Kadıköy"
                  className="w-full px-3.5 py-2 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-text-primary">Posta Kodu *</label>
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="34710"
                  className="w-full px-3.5 py-2 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary"
                />
              </div>
            </div>

            {/* Defaults Checkboxes */}
            <div className="pt-2 space-y-2 border-t border-border-subtle">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-text-primary">
                <input
                  type="checkbox"
                  checked={isDefaultShipping}
                  onChange={(e) => setIsDefaultShipping(e.target.checked)}
                  className="rounded border-border-default text-text-primary focus:ring-0"
                />
                <span>Varsayılan Teslimat Adresim Yap</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-text-primary">
                <input
                  type="checkbox"
                  checked={isDefaultBilling}
                  onChange={(e) => setIsDefaultBilling(e.target.checked)}
                  className="rounded border-border-default text-text-primary focus:ring-0"
                />
                <span>Varsayılan Fatura Adresim Yap</span>
              </label>
            </div>

            {/* Submit & Cancel */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-action-primary text-action-primary-text text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <span>{isEditing ? 'Güncelle' : 'Adresi Kaydet'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

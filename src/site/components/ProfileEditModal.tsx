import { useState, useEffect, useRef, type FormEvent } from 'react';
import { X, User, Phone, Check, AlertCircle, LoaderCircle } from 'lucide-react';
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap';
import type { CustomerProfile, UpdateProfileInput } from '@/entities/customer/types';

export interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CustomerProfile | null;
  email: string | null;
  onSave: (input: UpdateProfileInput) => Promise<void>;
}

export function ProfileEditModal({
  isOpen,
  onClose,
  profile,
  email,
  onSave,
}: ProfileEditModalProps) {
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { containerRef } = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isOpen && profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setPhone(profile.phone || '');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSave({
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        phone: phone.trim() || null,
      });
      setSuccess(true);
      timerRef.current = setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Profil kaydedilirken hata oluştu.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      {/* Modal Dialog */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Profil Bilgilerini Düzenle"
        className="relative w-full max-w-md bg-surface-primary border border-border-default shadow-elevated z-10 p-6 sm:p-8 animate-fade-scale text-left"
      >
        {/* Close button */}
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
              Hesap Ayarları
            </span>
            <h3 className="font-display text-2xl text-text-primary">Profil Bilgileri</h3>
            <p className="text-xs text-text-secondary">
              Kişisel iletişim bilgilerinizi güncelleyin.
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
              <span>Profil başarıyla güncellendi.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email (Read-only OAuth Identity) */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-text-secondary">
                Google E-Posta (Değiştirilemez)
              </label>
              <input
                type="text"
                disabled
                value={email || ''}
                className="w-full px-3.5 py-2.5 text-xs bg-surface-muted border border-border-subtle text-text-muted cursor-not-allowed"
              />
            </div>

            {/* First Name */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-text-primary">Ad</label>
              <div className="relative">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Adınız"
                  className="w-full px-3.5 py-2.5 pl-9 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary transition-colors"
                />
                <User className="w-4 h-4 absolute left-3 top-3 text-text-muted" />
              </div>
            </div>

            {/* Last Name */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-text-primary">Soyad</label>
              <div className="relative">
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Soyadınız"
                  className="w-full px-3.5 py-2.5 pl-9 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary transition-colors"
                />
                <User className="w-4 h-4 absolute left-3 top-3 text-text-muted" />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-text-primary">
                Telefon Numarası
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0555 123 45 67"
                  className="w-full px-3.5 py-2.5 pl-9 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary transition-colors"
                />
                <Phone className="w-4 h-4 absolute left-3 top-3 text-text-muted" />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-border-subtle">
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
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-action-primary text-action-primary-text text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <span>Kaydet</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useContext } from 'react';
import { createPortal } from 'react-dom';
import { KeyRound, X, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { adminAuthService } from '../auth/admin-auth-service';
import { ToastContext } from '../ui/ToastContext';

export interface AdminChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminChangePasswordModal({ isOpen, onClose }: AdminChangePasswordModalProps) {
  const toastContext = useContext(ToastContext);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setErrorMessage(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentPassword.trim()) {
      setErrorMessage('Lütfen güncel şifrenizi giriniz.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Yeni şifre en az 6 karakter uzunluğunda olmalıdır.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Yeni şifreler birbiriyle uyuşmuyor.');
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMessage('Yeni şifreniz güncel şifrenizle aynı olamaz.');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminAuthService.changePassword(currentPassword, newPassword);
      toastContext?.success('Şifre Güncellendi', 'Yönetici şifreniz başarıyla değiştirildi.');
      resetForm();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Şifre güncellenirken bir hata oluştu.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-surface-primary border border-border-default shadow-elevated p-6 sm:p-7 space-y-5 animate-fade-scale text-left relative"
      >
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          aria-label="Kapat"
          className="absolute top-4 right-4 p-1.5 text-text-muted hover:text-text-primary rounded-full transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-accent-primary" />
          </div>
          <div>
            <h2 id="change-password-title" className="text-base font-semibold text-text-primary">
              Şifre Değiştir
            </h2>
            <p className="text-xs text-text-secondary">
              Yönetici hesabınız için yeni bir güvenlik parolası belirleyin.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-feedback-danger-surface border border-feedback-danger/20 text-feedback-danger text-xs flex items-start gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-text-primary">
              Güncel Şifre
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                required
                disabled={isSubmitting}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Mevcut şifrenizi girin"
                autoComplete="current-password"
                className="w-full px-3 py-2 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary disabled:opacity-50 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors p-1"
                aria-label={showCurrentPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                tabIndex={-1}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-text-primary">
              Yeni Şifre
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                disabled={isSubmitting}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="En az 6 karakter"
                autoComplete="new-password"
                className="w-full px-3 py-2 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary disabled:opacity-50 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors p-1"
                aria-label={showNewPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-text-primary">
              Yeni Şifre (Tekrar)
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                disabled={isSubmitting}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Yeni şifrenizi tekrar girin"
                autoComplete="new-password"
                className="w-full px-3 py-2 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary disabled:opacity-50 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors p-1"
                aria-label={showConfirmPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary border border-border-default hover:bg-surface-secondary transition-colors disabled:opacity-50"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-action-primary text-action-primary-text hover:bg-neutral-800 transition-colors disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Güncelleniyor...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Şifreyi Güncelle</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

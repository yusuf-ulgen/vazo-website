import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  User,
  LogOut,
  ArrowRight,
  Heart,
  ShoppingBag,
  Building2,
  MapPin,
  AlertCircle,
  ShieldCheck,
  LoaderCircle,
} from 'lucide-react';
import { useCustomerAuth } from '@/shared/stores/customer-auth-store';
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnUrl?: string;
}

export function AuthModal({ isOpen, onClose, returnUrl = '/account' }: AuthModalProps) {
  const { user, displayName, email, isAuthenticated, signInWithGoogle, signOut, customerType } =
    useCustomerAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { containerRef } = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setIsSigningIn(true);
    try {
      await signInWithGoogle(returnUrl);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Google ile giriş başlatılırken bir hata oluştu.';
      setErrorMsg(msg);
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Çıkış yapılamadı.';
      setErrorMsg(msg);
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

      {/* Modal Card */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Kullanıcı Girişi ve Profil"
        className="relative w-full max-w-md bg-surface-primary border border-border-default shadow-elevated z-10 p-6 sm:p-8 animate-fade-scale text-left"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Kapat"
          className="absolute top-5 right-5 p-1.5 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isAuthenticated && user ? (
          /* Logged In View */
          <div className="space-y-6">
            <div className="flex items-center gap-3.5 border-b border-border-subtle pb-4">
              <div className="w-12 h-12 rounded-full bg-surface-secondary border border-border-default flex items-center justify-center text-text-primary shrink-0">
                <User className="w-6 h-6 text-text-secondary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg text-text-primary font-medium truncate">
                    {displayName}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-surface-secondary border border-border-subtle text-text-secondary rounded shrink-0">
                    {customerType === 'wholesale' ? 'Toptan Müşteri' : 'Bireysel'}
                  </span>
                </div>
                <p className="text-xs text-text-secondary truncate mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-feedback-success shrink-0" />
                  <span className="truncate">{email || 'Google Hesabı'}</span>
                </p>
              </div>
            </div>

            {/* Quick Actions List */}
            <div className="space-y-2 text-xs">
              <Link
                to="/account"
                onClick={onClose}
                className="w-full flex items-center justify-between p-3 bg-surface-secondary hover:bg-surface-muted text-text-primary border border-border-subtle transition-colors"
              >
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4 text-text-secondary" />
                  <span>Hesap Bilgilerim</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-text-secondary" />
              </Link>

              <Link
                to="/account/addresses"
                onClick={onClose}
                className="w-full flex items-center justify-between p-3 bg-surface-secondary hover:bg-surface-muted text-text-primary border border-border-subtle transition-colors"
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-text-secondary" />
                  <span>Kayıtlı Adreslerim</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-text-secondary" />
              </Link>

              <Link
                to="/cart"
                onClick={onClose}
                className="w-full flex items-center justify-between p-3 bg-surface-secondary hover:bg-surface-muted text-text-primary border border-border-subtle transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-text-secondary" />
                  <span>Alışveriş Sepetim</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-text-secondary" />
              </Link>

              <Link
                to="/wishlist"
                onClick={onClose}
                className="w-full flex items-center justify-between p-3 bg-surface-secondary hover:bg-surface-muted text-text-primary border border-border-subtle transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-text-secondary" />
                  <span>Favorilerim</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-text-secondary" />
              </Link>

              <Link
                to="/wholesale/apply"
                onClick={onClose}
                className="w-full flex items-center justify-between p-3 bg-surface-secondary hover:bg-surface-muted text-text-primary border border-border-subtle transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-text-secondary" />
                  <span>Toptan Satış Başvurusu</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-text-secondary" />
              </Link>
            </div>

            {/* Logout Button */}
            <div className="pt-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-feedback-danger hover:bg-feedback-danger-surface transition-colors font-medium border border-transparent"
              >
                <LogOut className="w-4 h-4" />
                <span>Oturumu Kapat</span>
              </button>
            </div>
          </div>
        ) : (
          /* Sign In View */
          <div className="space-y-6">
            <div className="space-y-1.5">
              <span className="text-[11px] uppercase font-semibold tracking-editorial text-text-secondary">
                Müşteri Girişi
              </span>
              <h3 className="font-display text-2xl text-text-primary font-normal">
                Vazo Studio Hesabı
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Sipariş vermek, teslimat adreslerinizi yönetmek ve sipariş durumunuzu takip etmek için Google hesabınızla güvenle giriş yapın.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-feedback-danger-surface text-feedback-danger text-xs flex items-center gap-2 border border-feedback-danger/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              type="button"
              disabled={isSigningIn}
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-surface-primary hover:bg-surface-secondary text-text-primary border border-border-default transition-colors text-xs font-medium shadow-xs disabled:opacity-60"
            >
              {isSigningIn ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin text-text-secondary" />
                  <span>Google Bağlantısı Kuruluyor...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="font-semibold">Google ile Giriş Yap</span>
                </>
              )}
            </button>

            <div className="pt-2 text-[11px] text-text-muted text-center leading-relaxed">
              Giriş yaparak Vazo Studio{' '}
              <Link to="/policies/terms-of-service" onClick={onClose} className="underline hover:text-text-primary">
                Kullanım Koşulları
              </Link>{' '}
              ve{' '}
              <Link to="/policies/privacy-policy" onClick={onClose} className="underline hover:text-text-primary">
                Gizlilik Politikası
              </Link>
              'nı kabul etmiş sayılırsınız.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { X, User, LogOut, ArrowRight, CheckCircle2, Heart, ShoppingBag, Building2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/shared/stores/auth-store';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { user, isAuthenticated, login, loginWithGoogle, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      setErrorMsg(null);
      setSuccessMsg(null);
      setPassword('');
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !email.includes('@')) {
      setErrorMsg('Geçerli bir e-posta adresi giriniz.');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMsg('Şifreniz en az 4 karakter olmalıdır.');
      return;
    }

    try {
      login(email, password);
      setSuccessMsg('Giriş başarılı!');
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Giriş yapılamadı.';
      setErrorMsg(msg);
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
    setSuccessMsg('Google ile giriş yapıldı.');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleLogout = () => {
    logout();
    setSuccessMsg(null);
    setErrorMsg(null);
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
                    {user.email === 'Misafir Oturumu' ? 'Misafir Ziyaretçi' : (user.name || user.email)}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-surface-secondary border border-border-subtle text-text-secondary rounded shrink-0">
                    {user.email === 'Misafir Oturumu' ? 'Ziyaretçi Oturumu' : 'Üye'}
                  </span>
                </div>
                <p className="text-xs text-text-secondary truncate mt-0.5">
                  {user.email === 'Misafir Oturumu'
                    ? 'Kayıtlı Profil Bulunmuyor • Hızlı Takip'
                    : user.email}
                </p>
              </div>
            </div>

            {/* Quick Actions List */}
            <div className="space-y-2 text-xs">
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
          /* Sign In Form View */
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-[11px] uppercase font-semibold tracking-editorial text-text-secondary">
                Hesap Erişimi
              </span>
              <h3 className="font-display text-2xl text-text-primary font-normal">
                Giriş Yap veya Kayıt Ol
              </h3>
              <p className="text-xs text-text-secondary">
                E-posta ve şifrenizle giriş yaparak hesabınızı yönetin.
              </p>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-surface-primary hover:bg-surface-secondary text-text-primary border border-border-default transition-colors text-xs font-medium shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>Google ile Devam Et</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border-subtle" />
              <span className="text-[10px] uppercase text-text-muted">veya e-posta ile</span>
              <div className="flex-1 h-px bg-border-subtle" />
            </div>

            {errorMsg && (
              <div className="p-3 bg-feedback-danger-surface text-feedback-danger text-xs flex items-center gap-2 border border-feedback-danger/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-feedback-success-surface text-feedback-success text-xs flex items-center gap-2 border border-feedback-success/20">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-text-primary">
                  E-Posta Adresi
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@vazostudio.com"
                  className="w-full px-3.5 py-2.5 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-text-primary">
                  Şifre
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-action-primary text-action-primary-text py-3 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors shadow-xs"
              >
                <span>Giriş Yap / Kaydol</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

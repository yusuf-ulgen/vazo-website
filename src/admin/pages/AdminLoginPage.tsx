import { useState, type FormEvent, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, ArrowRight, ArrowLeft, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAdminAuth } from '../auth/AdminAuthContext';
import { translateAuthError } from '@/shared/utils/auth-error-translator';

export function AdminLoginPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, from]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !email.includes('@')) {
      setErrorMsg('Geçerli bir yönetici e-posta adresi giriniz.');
      return;
    }

    if (!password) {
      setErrorMsg('Lütfen şifrenizi giriniz.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setErrorMsg(translateAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-warm flex items-center justify-center p-4 sm:p-6 text-left">
      <div className="w-full max-w-md bg-surface-primary border border-border-default shadow-elevated p-8 space-y-6 animate-fade-scale">
        <div className="w-12 h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center">
          <Shield className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] uppercase font-semibold tracking-editorial text-text-secondary">
            Güvenli Yönetim Portalı
          </span>
          <h1 className="font-display text-2xl sm:text-3xl text-text-primary font-normal">
            Yönetici Girişi
          </h1>
          <p className="text-xs text-text-secondary leading-relaxed">
            Monocactus yönetim paneline erişmek için yetkili kimlik bilgilerinizi giriniz.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-feedback-danger-surface border border-feedback-danger/20 text-feedback-danger text-xs flex items-start gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-text-primary">
              Yönetici E-Posta
            </label>
            <input
              type="email"
              required
              disabled={isSubmitting}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@monocactus.com"
              autoComplete="username"
              className="w-full px-3.5 py-2.5 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary disabled:opacity-50"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-text-primary">
              Şifre
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={isSubmitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 pr-10 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors p-1"
                aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-action-primary text-action-primary-text py-3 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Doğrulanıyor...</span>
              </>
            ) : (
              <>
                <span>Yönetici Olarak Giriş Yap</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-border-subtle flex items-center justify-between text-xs">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-text-primary hover:underline font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Mağazaya Dön</span>
          </Link>
          <span className="text-[11px] text-text-secondary font-medium">
            Supabase DB RBAC Korumalı
          </span>
        </div>
      </div>
    </div>
  );
}

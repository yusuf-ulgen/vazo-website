import { useState, type FormEvent } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Shield, ArrowRight, ArrowLeft } from 'lucide-react';
import { AdminSidebar } from '../components/AdminSidebar';
import { AdminHeader } from '../components/AdminHeader';
import { useAuth } from '@/shared/stores/auth-store';
import { cn } from '@/shared/lib/cn';

export function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAdmin, login } = useAuth();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAdminLogin = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!loginEmail) return;

    try {
      const loggedIn = login(loginEmail, loginPassword);
      if (loggedIn.role !== 'admin') {
        setErrorMsg('Bu e-posta adresinin yönetici yetkisi bulunmamaktadır. Lütfen yetkili admin adresinizi girin.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Yönetici girişi başarısız oldu.';
      setErrorMsg(msg);
    }
  };

  // If user is not logged in as admin, show elegant admin access screen
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-canvas-warm flex items-center justify-center p-4 sm:p-6 text-left">
        <div className="w-full max-w-md bg-surface-primary border border-border-default shadow-elevated p-8 space-y-6 animate-fade-scale">
          <div className="w-12 h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-2xl sm:text-3xl text-text-primary font-normal">
              Yönetici Girişi
            </h1>
            <p className="text-xs text-text-secondary leading-relaxed">
              Yönetim paneline erişmek için yetkili yönetici e-posta ve şifrenizi giriniz.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-feedback-danger-surface border border-feedback-danger/20 text-feedback-danger text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-text-primary">
                Yönetici E-Posta
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="adminvazo@gmail.com"
                className="w-full px-3.5 py-2.5 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-text-primary">
                Şifre
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-xs bg-surface-secondary border border-border-default focus:border-text-primary focus:outline-none text-text-primary"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-action-primary text-action-primary-text py-3 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors shadow-xs"
            >
              <span>Yönetici Olarak Giriş Yap</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-border-subtle flex items-center justify-between text-xs">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Mağazaya Dön</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas-subtle text-text-primary flex">
      {/* Sidebar */}
      <AdminSidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300 min-w-0',
          isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        )}
      >
        <AdminHeader onOpenMobileSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

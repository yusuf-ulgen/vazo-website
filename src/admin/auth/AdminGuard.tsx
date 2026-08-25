import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from './AdminAuthContext';
import { Shield } from 'lucide-react';

export function AdminGuard() {
  const { adminUser, isLoading, isAuthenticated } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas-warm flex items-center justify-center p-6 text-center">
        <div className="space-y-4 animate-fade-in">
          <div className="w-12 h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Shield className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-text-primary tracking-wide">
              Yönetici Oturumu Doğrulanıyor
            </h2>
            <p className="text-xs text-text-secondary">
              Güvenlik ve RBAC yetkileri kontrol ediliyor...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !adminUser) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

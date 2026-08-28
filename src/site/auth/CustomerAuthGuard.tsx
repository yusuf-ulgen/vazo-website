import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '@/shared/stores/customer-auth-store';

export interface CustomerAuthGuardProps {
  children: ReactNode;
}

export function CustomerAuthGuard({ children }: CustomerAuthGuardProps) {
  const { isAuthenticated, isLoading } = useCustomerAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-4 animate-pulse">
          <div className="h-8 w-1/3 mx-auto bg-surface-secondary rounded" />
          <div className="h-24 w-full bg-surface-secondary rounded" />
          <div className="h-48 w-full bg-surface-secondary rounded" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve requested location for post-login redirect
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/?auth_required=true&return_to=${returnUrl}`} replace />;
  }

  return <>{children}</>;
}

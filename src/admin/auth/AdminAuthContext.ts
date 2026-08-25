import { createContext, useContext } from 'react';
import type { AdminProfile } from './admin-auth-service';

export interface AdminAuthContextValue {
  adminUser: AdminProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AdminProfile>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

import React, { useState, useEffect, useCallback } from 'react';
import { adminAuthService, AdminProfile } from './admin-auth-service';
import { AdminAuthContext, AdminAuthContextValue } from './AdminAuthContext';

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const profile = await adminAuthService.getCurrentAdmin();
      setAdminUser(profile);
      setError(null);
    } catch (err: unknown) {
      setAdminUser(null);
      setError(err instanceof Error ? err.message : 'Oturum doğrulanamadı.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();

    const { unsubscribe } = adminAuthService.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        setAdminUser(null);
        setIsLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const profile = await adminAuthService.getCurrentAdmin();
        setAdminUser(profile);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [checkSession]);

  const login = async (email: string, password: string): Promise<AdminProfile> => {
    setError(null);
    setIsLoading(true);
    try {
      const profile = await adminAuthService.login(email, password);
      setAdminUser(profile);
      return profile;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Giriş yapılamadı.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await adminAuthService.logout();
      setAdminUser(null);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AdminAuthContextValue = {
    adminUser,
    isLoading,
    isAuthenticated: Boolean(adminUser && adminUser.active),
    error,
    login,
    logout,
    refreshSession: checkSession,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

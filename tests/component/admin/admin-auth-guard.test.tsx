import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminAuthProvider } from '@/admin/auth/AdminAuthProvider';
import { AdminGuard } from '@/admin/auth/AdminGuard';
import { AdminLoginPage } from '@/admin/pages/AdminLoginPage';
import { AdminHeader } from '@/admin/components/AdminHeader';
import { adminAuthService } from '@/admin/auth/admin-auth-service';

describe('Admin Guard & UI Components (Phase 2.2 RBAC Integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AdminGuard Component', () => {
    it('redirects unauthenticated visitor to /admin/login', async () => {
      vi.spyOn(adminAuthService, 'getCurrentAdmin').mockResolvedValue(null);
      vi.spyOn(adminAuthService, 'onAuthStateChange').mockReturnValue({
        unsubscribe: vi.fn(),
      });

      render(
        <AdminAuthProvider>
          <MemoryRouter initialEntries={['/admin']}>
            <Routes>
              <Route path="/admin/login" element={<div>Admin Login View</div>} />
              <Route path="/admin" element={<AdminGuard />}>
                <Route index element={<div>Secret Admin Dashboard</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AdminAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Admin Login View')).toBeInTheDocument();
      });
      expect(screen.queryByText('Secret Admin Dashboard')).not.toBeInTheDocument();
    });

    it('renders protected dashboard for authenticated active admin', async () => {
      vi.spyOn(adminAuthService, 'getCurrentAdmin').mockResolvedValue({
        id: 'admin-uuid-1',
        email: 'admin@vazostudio.com',
        role: 'admin',
        active: true,
      });
      vi.spyOn(adminAuthService, 'onAuthStateChange').mockReturnValue({
        unsubscribe: vi.fn(),
      });

      render(
        <AdminAuthProvider>
          <MemoryRouter initialEntries={['/admin']}>
            <Routes>
              <Route path="/admin/login" element={<div>Admin Login View</div>} />
              <Route path="/admin" element={<AdminGuard />}>
                <Route index element={<div>Secret Admin Dashboard</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AdminAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Secret Admin Dashboard')).toBeInTheDocument();
      });
      expect(screen.queryByText('Admin Login View')).not.toBeInTheDocument();
    });
  });

  describe('AdminLoginPage Component', () => {
    it('renders login form and submits credentials to adminAuthService', async () => {
      vi.spyOn(adminAuthService, 'getCurrentAdmin').mockResolvedValue(null);
      vi.spyOn(adminAuthService, 'onAuthStateChange').mockReturnValue({
        unsubscribe: vi.fn(),
      });
      const loginSpy = vi.spyOn(adminAuthService, 'login').mockResolvedValue({
        id: 'admin-uuid-2',
        email: 'editor@vazostudio.com',
        role: 'admin',
        active: true,
      });

      render(
        <AdminAuthProvider>
          <MemoryRouter initialEntries={['/admin/login']}>
            <AdminLoginPage />
          </MemoryRouter>
        </AdminAuthProvider>
      );

      expect(screen.getByText('Yönetici Girişi')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('admin@vazostudio.com')).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText('admin@vazostudio.com'), {
        target: { value: 'editor@vazostudio.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), {
        target: { value: 'ValidPass123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Yönetici Olarak Giriş Yap/i }));

      await waitFor(() => {
        expect(loginSpy).toHaveBeenCalledWith('editor@vazostudio.com', 'ValidPass123');
      });
    });

    it('displays error feedback when login fails', async () => {
      vi.spyOn(adminAuthService, 'getCurrentAdmin').mockResolvedValue(null);
      vi.spyOn(adminAuthService, 'onAuthStateChange').mockReturnValue({
        unsubscribe: vi.fn(),
      });
      vi.spyOn(adminAuthService, 'login').mockRejectedValue(
        new Error('Bu hesabın yönetici paneline erişim yetkisi bulunmamaktadır.')
      );

      render(
        <AdminAuthProvider>
          <MemoryRouter initialEntries={['/admin/login']}>
            <AdminLoginPage />
          </MemoryRouter>
        </AdminAuthProvider>
      );

      fireEvent.change(screen.getByPlaceholderText('admin@vazostudio.com'), {
        target: { value: 'notadmin@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), {
        target: { value: 'SomePass' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Yönetici Olarak Giriş Yap/i }));

      await waitFor(() => {
        expect(
          screen.getByText('Bu hesabın yönetici paneline erişim yetkisi bulunmamaktadır.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('AdminHeader Component', () => {
    it('displays real authenticated admin email and role badge', async () => {
      vi.spyOn(adminAuthService, 'getCurrentAdmin').mockResolvedValue({
        id: 'super-uuid',
        email: 'boss@vazostudio.com',
        role: 'super_admin',
        active: true,
      });
      vi.spyOn(adminAuthService, 'onAuthStateChange').mockReturnValue({
        unsubscribe: vi.fn(),
      });

      render(
        <AdminAuthProvider>
          <MemoryRouter initialEntries={['/admin']}>
            <AdminHeader onOpenMobileSidebar={vi.fn()} />
          </MemoryRouter>
        </AdminAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('boss@vazostudio.com')).toBeInTheDocument();
        expect(screen.getByText('Süper Admin')).toBeInTheDocument();
      });
    });

    it('triggers logout on logout button click', async () => {
      vi.spyOn(adminAuthService, 'getCurrentAdmin').mockResolvedValue({
        id: 'admin-uuid-5',
        email: 'moderator@vazostudio.com',
        role: 'admin',
        active: true,
      });
      vi.spyOn(adminAuthService, 'onAuthStateChange').mockReturnValue({
        unsubscribe: vi.fn(),
      });
      const logoutSpy = vi.spyOn(adminAuthService, 'logout').mockResolvedValue();

      render(
        <AdminAuthProvider>
          <MemoryRouter initialEntries={['/admin']}>
            <AdminHeader onOpenMobileSidebar={vi.fn()} />
          </MemoryRouter>
        </AdminAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('moderator@vazostudio.com')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Çıkış Yap' }));

      await waitFor(() => {
        expect(logoutSpy).toHaveBeenCalled();
      });
    });
  });
});

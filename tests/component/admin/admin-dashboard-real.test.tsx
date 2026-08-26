import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboardPage } from '@/admin/pages/AdminDashboardPage';
import { AdminAuthContext, AdminAuthContextValue } from '@/admin/auth/AdminAuthContext';
import { ToastProvider } from '@/admin/ui';

const mockAdminUser = {
  id: 'admin-uuid-1',
  email: 'admin@vazostudio.com',
  role: 'admin' as const,
  active: true,
};

const defaultAuthContext: AdminAuthContextValue = {
  adminUser: mockAdminUser,
  isLoading: false,
  isAuthenticated: true,
  error: null,
  login: vi.fn(),
  logout: vi.fn(),
  refreshSession: vi.fn(),
};

describe('AdminDashboardPage (Real Data & No Fake Metrics)', () => {
  it('renders genuine repository-backed metrics without fake revenue or order data', async () => {
    render(
      <AdminAuthContext.Provider value={defaultAuthContext}>
        <MemoryRouter initialEntries={['/admin']}>
          <ToastProvider>
            <AdminDashboardPage />
          </ToastProvider>
        </MemoryRouter>
      </AdminAuthContext.Provider>
    );

    expect(screen.getByText('Yönetim Paneli')).toBeInTheDocument();

    // Verify real metric headings exist
    await waitFor(() => {
      expect(screen.getByText('Ürün Kataloğu')).toBeInTheDocument();
      expect(screen.getByText('Stok & Varyantlar')).toBeInTheDocument();
      expect(screen.getByText('Gelen Talep & Başvuru')).toBeInTheDocument();
      expect(screen.getByText('Bülten & Kitle')).toBeInTheDocument();
      expect(screen.getByText('Son Denetim & Yönetim Olayları')).toBeInTheDocument();
    });

    // Verify ABSOLUTELY NO fake ecommerce metric texts
    expect(screen.queryByText(/Toplam Ciro/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Aylık Gelir/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Son Siparişler/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Kargodaki Siparişler/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Satış Grafiği/i)).not.toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminLayout } from '@/admin/layouts/AdminLayout';
import { AdminSidebar } from '@/admin/components/AdminSidebar';
import { AdminHeader } from '@/admin/components/AdminHeader';
import { AdminDashboardPage } from '@/admin/pages/AdminDashboardPage';
import { AdminModuleScaffoldPage } from '@/admin/pages/AdminModuleScaffoldPage';
import { AdminAuthContext, AdminAuthContextValue } from '@/admin/auth/AdminAuthContext';
import { Package } from 'lucide-react';

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

function renderWithAdminContext(ui: React.ReactNode, authValue = defaultAuthContext) {
  return render(
    <AdminAuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={['/admin']}>
        {ui}
      </MemoryRouter>
    </AdminAuthContext.Provider>
  );
}

describe('Admin Production Shell & Dashboard (Phase 2.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AdminDashboardPage', () => {
    it('renders authenticated welcome and real module navigation cards without fake metrics', () => {
      renderWithAdminContext(<AdminDashboardPage />);

      // Welcome header
      expect(screen.getByText('Yönetim Paneli')).toBeInTheDocument();
      expect(screen.getByText(/admin@vazostudio.com/)).toBeInTheDocument();
      expect(screen.getByText('Sistem Canlı')).toBeInTheDocument();

      // System status banner
      expect(screen.getByText('Güvenlik & Veritabanı Durumu')).toBeInTheDocument();
      expect(screen.getByText('PostgreSQL RLS')).toBeInTheDocument();

      // Verify NO fake numbers or fake sales revenue are displayed
      expect(screen.queryByText(/₺148/)).not.toBeInTheDocument();
      expect(screen.queryByText('Kritik Stok Uyarısı')).not.toBeInTheDocument();
      expect(screen.queryByText('Son Siparişler')).not.toBeInTheDocument();

      // Verify real module cards exist
      expect(screen.getByText('Ürün Yönetimi')).toBeInTheDocument();
      expect(screen.getByText('Kategoriler')).toBeInTheDocument();
      expect(screen.getByText('Koleksiyonlar')).toBeInTheDocument();
      expect(screen.getByText('Stok & Envanter')).toBeInTheDocument();
      expect(screen.getByText('Toptan Portalı')).toBeInTheDocument();
      expect(screen.getByText('İçerik & CMS')).toBeInTheDocument();
      expect(screen.getByText('Gelen Başvurular')).toBeInTheDocument();
      expect(screen.getByText('Site Ayarları')).toBeInTheDocument();
    });
  });

  describe('AdminSidebar Component', () => {
    it('renders real Phase 2 navigation items and handles collapse toggle', () => {
      const handleToggle = vi.fn();
      const handleCloseMobile = vi.fn();

      const { rerender } = render(
        <MemoryRouter>
          <AdminSidebar
            isCollapsed={false}
            onToggleCollapse={handleToggle}
            mobileOpen={false}
            onCloseMobile={handleCloseMobile}
          />
        </MemoryRouter>
      );

      expect(screen.getByText('Vazo Admin')).toBeInTheDocument();
      expect(screen.getByText('Gösterge Paneli')).toBeInTheDocument();
      expect(screen.getByText('Ürün Yönetimi')).toBeInTheDocument();
      expect(screen.getByText('Kategoriler')).toBeInTheDocument();
      expect(screen.getByText('Gelen Başvurular')).toBeInTheDocument();

      // Verify NO legacy "Phase 0 Governance" notice exists
      expect(screen.queryByText('Phase 0 Governance')).not.toBeInTheDocument();

      // Toggle collapse
      const collapseBtn = screen.getByRole('button', { name: 'Menüyü Daralt' });
      fireEvent.click(collapseBtn);
      expect(handleToggle).toHaveBeenCalledTimes(1);

      // In collapsed state
      rerender(
        <MemoryRouter>
          <AdminSidebar
            isCollapsed={true}
            onToggleCollapse={handleToggle}
            mobileOpen={false}
            onCloseMobile={handleCloseMobile}
          />
        </MemoryRouter>
      );

      expect(screen.getByRole('button', { name: 'Menüyü Genişlet' })).toBeInTheDocument();
    });
  });

  describe('AdminHeader Component', () => {
    it('renders authenticated admin details and triggers logout on button click', () => {
      const logoutMock = vi.fn();
      const authWithLogout: AdminAuthContextValue = {
        ...defaultAuthContext,
        logout: logoutMock,
      };

      renderWithAdminContext(<AdminHeader onOpenMobileSidebar={vi.fn()} />, authWithLogout);

      expect(screen.getByText('Gösterge Paneli')).toBeInTheDocument();
      expect(screen.getByText('admin@vazostudio.com')).toBeInTheDocument();
      expect(screen.getAllByText('Admin').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('link', { name: /Mağazayı Gör/ })).toBeInTheDocument();

      // Trigger logout
      const logoutBtn = screen.getByRole('button', { name: 'Çıkış Yap' });
      fireEvent.click(logoutBtn);
      expect(logoutMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('AdminLayout & Scaffold Integration', () => {
    it('renders AdminLayout shell with child route content', () => {
      render(
        <AdminAuthContext.Provider value={defaultAuthContext}>
          <MemoryRouter initialEntries={['/admin/test']}>
            <Routes>
              <Route path="/admin" element={<AdminLayout />}>
                <Route path="test" element={<div>Admin Test Modül İçeriği</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AdminAuthContext.Provider>
      );

      expect(screen.getByText('Admin Test Modül İçeriği')).toBeInTheDocument();
      expect(screen.getByText('Vazo Admin')).toBeInTheDocument();
    });

    it('renders AdminModuleScaffoldPage cleanly with planned features', () => {
      render(
        <MemoryRouter>
          <AdminModuleScaffoldPage
            moduleName="Test Modülü"
            moduleCode="MOD-TST-01"
            description="Test modülü açıklaması"
            icon={Package}
            plannedFeatures={['Özellik 1', 'Özellik 2']}
          />
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { level: 1, name: 'Test Modülü' })).toBeInTheDocument();
      expect(screen.getByText('MOD-TST-01')).toBeInTheDocument();
      expect(screen.getByText('Özellik 1')).toBeInTheDocument();
      expect(screen.getByText('Özellik 2')).toBeInTheDocument();
    });
  });
});

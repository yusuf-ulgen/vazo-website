import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  AdminPageHeader,
  Breadcrumb,
  AdminCard,
  StatusBadge,
  SearchField,
  FilterDropdown,
  Pagination,
  LoadingSkeleton,
  EmptyState,
  ErrorState,
  ConfirmDialog,
  FormField,
  AdminInput,
  AdminSelect,
  AdminTextarea,
  ToastProvider,
  useToast,
} from '@/admin/ui';

describe('Admin UI Shared Primitives (Phase 2.3)', () => {
  describe('Breadcrumb & AdminPageHeader', () => {
    it('renders breadcrumb items and navigation hierarchy', () => {
      render(
        <MemoryRouter>
          <Breadcrumb
            items={[
              { label: 'Ürünler', href: '/admin/products' },
              { label: 'Yeni Ürün Ekle' },
            ]}
          />
        </MemoryRouter>
      );

      expect(screen.getByText('Ürünler')).toBeInTheDocument();
      expect(screen.getByText('Yeni Ürün Ekle')).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    });

    it('renders AdminPageHeader with title, description, badge, and actions', () => {
      render(
        <MemoryRouter>
          <AdminPageHeader
            title="Kategori Yönetimi"
            description="Kategori ağacını yönetin"
            badge={<span data-testid="badge">3 Kategori</span>}
            actions={<button>Yeni Kategori</button>}
          />
        </MemoryRouter>
      );

      expect(screen.getByText('Kategori Yönetimi')).toBeInTheDocument();
      expect(screen.getByText('Kategori ağacını yönetin')).toBeInTheDocument();
      expect(screen.getByTestId('badge')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Yeni Kategori' })).toBeInTheDocument();
    });
  });

  describe('AdminCard Component', () => {
    it('renders card with title, subtitle, body, and footer', () => {
      render(
        <AdminCard
          title="Stok Durumu"
          subtitle="Atölye güncel sayım"
          actions={<button>Düzenle</button>}
          footer={<span>Son güncelleme: Bugün</span>}
        >
          <p>Kart İçeriği</p>
        </AdminCard>
      );

      expect(screen.getByText('Stok Durumu')).toBeInTheDocument();
      expect(screen.getByText('Atölye güncel sayım')).toBeInTheDocument();
      expect(screen.getByText('Kart İçeriği')).toBeInTheDocument();
      expect(screen.getByText('Son güncelleme: Bugün')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Düzenle' })).toBeInTheDocument();
    });
  });

  describe('StatusBadge Component', () => {
    it('renders mapped labels and styles for various lifecycle statuses', () => {
      const { rerender } = render(<StatusBadge status="published" />);
      expect(screen.getByText('Yayında')).toBeInTheDocument();

      rerender(<StatusBadge status="draft" />);
      expect(screen.getByText('Taslak')).toBeInTheDocument();

      rerender(<StatusBadge status="pending" />);
      expect(screen.getByText('Beklemede')).toBeInTheDocument();

      rerender(<StatusBadge status="rejected" />);
      expect(screen.getByText('Reddedildi')).toBeInTheDocument();

      rerender(<StatusBadge status="custom_status" label="Özel Durum" />);
      expect(screen.getByText('Özel Durum')).toBeInTheDocument();
    });
  });

  describe('SearchField & FilterDropdown & Pagination', () => {
    it('handles search input and clear button', () => {
      const onChange = vi.fn();
      const { rerender } = render(<SearchField value="vazo" onChange={onChange} placeholder="Ürün ara..." />);

      expect(screen.getByPlaceholderText('Ürün ara...')).toBeInTheDocument();
      const clearBtn = screen.getByRole('button', { name: 'Aramayı temizle' });
      fireEvent.click(clearBtn);
      expect(onChange).toHaveBeenCalledWith('');

      rerender(<SearchField value="" onChange={onChange} />);
      const input = screen.getByPlaceholderText('Ara...');
      fireEvent.change(input, { target: { value: 'yeni arama' } });
      expect(onChange).toHaveBeenCalledWith('yeni arama');
    });

    it('handles filter dropdown changes', () => {
      const onChange = vi.fn();
      render(
        <FilterDropdown
          label="Durum Filtresi"
          value="all"
          onChange={onChange}
          options={[
            { label: 'Tümü', value: 'all' },
            { label: 'Yayında', value: 'published' },
            { label: 'Taslak', value: 'draft' },
          ]}
        />
      );

      const select = screen.getByRole('combobox', { name: 'Durum Filtresi' });
      fireEvent.change(select, { target: { value: 'published' } });
      expect(onChange).toHaveBeenCalledWith('published');
    });

    it('renders pagination and handles page navigation', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination
          currentPage={2}
          totalPages={5}
          totalItems={50}
          pageSize={10}
          onPageChange={onPageChange}
        />
      );

      expect(screen.getByText(/11-20/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Önceki Sayfa' })).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Sonraki Sayfa' })).toBeEnabled();

      fireEvent.click(screen.getByRole('button', { name: 'Sonraki Sayfa' }));
      expect(onPageChange).toHaveBeenCalledWith(3);

      fireEvent.click(screen.getByRole('button', { name: 'Önceki Sayfa' }));
      expect(onPageChange).toHaveBeenCalledWith(1);
    });
  });

  describe('LoadingSkeleton, EmptyState, ErrorState', () => {
    it('renders LoadingSkeleton with pulse placeholders', () => {
      const { container } = render(<LoadingSkeleton count={3} />);
      expect(container.querySelectorAll('.animate-pulse').length).toBe(3);
    });

    it('renders EmptyState with message and action', () => {
      render(
        <EmptyState
          title="Henüz ürün yok"
          description="Katalog boş görünüyor."
          action={<button>İlk Ürünü Ekle</button>}
        />
      );

      expect(screen.getByText('Henüz ürün yok')).toBeInTheDocument();
      expect(screen.getByText('Katalog boş görünüyor.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'İlk Ürünü Ekle' })).toBeInTheDocument();
    });

    it('renders ErrorState and calls onRetry when retry button is clicked', () => {
      const onRetry = vi.fn();
      render(<ErrorState error="Bağlantı koptu." onRetry={onRetry} />);

      expect(screen.getByText('Bağlantı koptu.')).toBeInTheDocument();
      const retryBtn = screen.getByRole('button', { name: 'Yeniden Dene' });
      fireEvent.click(retryBtn);
      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe('ConfirmDialog Keyboard & Focus Behavior', () => {
    it('handles confirm, cancel, and Escape key dismissal', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      const { rerender } = render(
        <ConfirmDialog
          isOpen={true}
          title="Ürünü Sil"
          message="Bu işlem geri alınamaz."
          isDestructive={true}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByText('Ürünü Sil')).toBeInTheDocument();
      expect(screen.getByText('Bu işlem geri alınamaz.')).toBeInTheDocument();

      // Click Confirm
      fireEvent.click(screen.getByRole('button', { name: 'Onayla' }));
      expect(onConfirm).toHaveBeenCalledTimes(1);

      // Click Cancel
      fireEvent.click(screen.getByRole('button', { name: 'İptal' }));
      expect(onCancel).toHaveBeenCalledTimes(1);

      // Press Escape
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onCancel).toHaveBeenCalledTimes(2);

      // Closed state renders null
      rerender(
        <ConfirmDialog
          isOpen={false}
          title="Ürünü Sil"
          message="Bu işlem geri alınamaz."
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  describe('FormField & Input Primitives', () => {
    it('renders FormField with label, required asterisk, hint, and error alert', () => {
      const { rerender } = render(
        <FormField label="Ürün Başlığı" required hint="Ziyaretçilere gösterilecek ad">
          <AdminInput placeholder="Vazo Adı" />
        </FormField>
      );

      expect(screen.getByText('Ürün Başlığı')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
      expect(screen.getByText('Ziyaretçilere gösterilecek ad')).toBeInTheDocument();

      rerender(
        <FormField label="Ürün Başlığı" error="Bu alan zorunludur.">
          <AdminInput error={true} />
        </FormField>
      );

      expect(screen.getByRole('alert')).toHaveTextContent('Bu alan zorunludur.');
    });

    it('renders AdminSelect and AdminTextarea correctly', () => {
      render(
        <div>
          <AdminSelect aria-label="Seçenek">
            <option value="1">Opsiyon 1</option>
          </AdminSelect>
          <AdminTextarea placeholder="Açıklama" />
        </div>
      );

      expect(screen.getByRole('combobox', { name: 'Seçenek' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Açıklama')).toBeInTheDocument();
    });
  });

  describe('Toast Notification System', () => {
    function TestToastConsumer() {
      const { success, error, warning, info } = useToast();
      return (
        <div>
          <button onClick={() => success('İşlem tamamlandı', 'Başarılı')}>Tetikle Başarı</button>
          <button onClick={() => error('Kayıt silinemedi', 'Hata')}>Tetikle Hata</button>
          <button onClick={() => warning('Stok azaldı', 'Uyarı')}>Tetikle Uyarı</button>
          <button onClick={() => info('Bilgilendirme', 'Bilgi')}>Tetikle Bilgi</button>
        </div>
      );
    }

    it('displays toast notifications with aria-live and handles manual dismissal', () => {
      render(
        <ToastProvider>
          <TestToastConsumer />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Tetikle Başarı' }));
      expect(screen.getByText('İşlem tamamlandı')).toBeInTheDocument();
      expect(screen.getByText('Başarılı')).toBeInTheDocument();

      const closeBtn = screen.getByRole('button', { name: 'Bildirimi kapat' });
      fireEvent.click(closeBtn);
      expect(screen.queryByText('İşlem tamamlandı')).not.toBeInTheDocument();
    });

    it('auto-dismisses toast after duration', () => {
      vi.useFakeTimers();

      render(
        <ToastProvider>
          <TestToastConsumer />
        </ToastProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Tetikle Hata' }));
      expect(screen.getByText('Kayıt silinemedi')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(4500);
      });

      expect(screen.queryByText('Kayıt silinemedi')).not.toBeInTheDocument();

      vi.useRealTimers();
    });
  });
});

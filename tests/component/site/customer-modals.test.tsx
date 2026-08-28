import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { ProfileEditModal } from '@/site/components/ProfileEditModal';
import { AddressFormModal } from '@/site/components/AddressFormModal';
import { renderWithRouter } from 'tests/utils/render-utils';

describe('Customer Profile & Address Modals', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('ProfileEditModal', () => {
    it('renders initial profile fields and handles form submission', () => {
      const handleSave = vi.fn().mockResolvedValue(undefined);
      const handleClose = vi.fn();

      const { unmount } = renderWithRouter(
        <ProfileEditModal
          isOpen={true}
          onClose={handleClose}
          profile={{
            user_id: 'u1',
            first_name: 'Ayşe',
            last_name: 'Demir',
            phone: '05551112233',
            customer_type: 'retail',
            wholesale_approved_at: null,
            created_at: '2026-08-28T00:00:00Z',
            updated_at: '2026-08-28T00:00:00Z',
          }}
          email="ayse@example.com"
          onSave={handleSave}
        />
      );

      expect(screen.getByRole('dialog', { name: 'Profil Bilgilerini Düzenle' })).toBeInTheDocument();
      expect(screen.getByDisplayValue('Ayşe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Demir')).toBeInTheDocument();
      expect(screen.getByDisplayValue('05551112233')).toBeInTheDocument();

      fireEvent.change(screen.getByDisplayValue('Ayşe'), { target: { value: 'Ayşe Nur' } });
      fireEvent.click(screen.getByRole('button', { name: 'Kaydet' }));

      expect(handleSave).toHaveBeenCalledWith({
        first_name: 'Ayşe Nur',
        last_name: 'Demir',
        phone: '05551112233',
      });
      unmount();
    });

    it('returns null when isOpen is false', () => {
      const { container, unmount } = renderWithRouter(
        <ProfileEditModal
          isOpen={false}
          onClose={vi.fn()}
          profile={null}
          email={null}
          onSave={vi.fn()}
        />
      );

      expect(container.firstChild).toBeNull();
      unmount();
    });
  });

  describe('AddressFormModal', () => {
    it('renders address form for editing and updates fields', () => {
      const handleSave = vi.fn().mockResolvedValue(undefined);
      const handleClose = vi.fn();

      const { unmount } = renderWithRouter(
        <AddressFormModal
          isOpen={true}
          onClose={handleClose}
          addressToEdit={{
            id: 'addr-1',
            user_id: 'u1',
            label: 'Yazlık',
            recipient_name: 'Ayşe Demir',
            phone: '05551112233',
            address_line1: 'Sahil Yolu No: 8',
            address_line2: 'Kat 2',
            district: 'Bodrum',
            city: 'Muğla',
            state_province: null,
            postal_code: '48400',
            country_code: 'TR',
            country_name: 'Türkiye',
            is_default_shipping: false,
            is_default_billing: false,
            created_at: '2026-08-28T00:00:00Z',
            updated_at: '2026-08-28T00:00:00Z',
          }}
          onSave={handleSave}
        />
      );

      expect(screen.getByRole('dialog', { name: 'Adresi Düzenle' })).toBeInTheDocument();
      expect(screen.getByDisplayValue('Yazlık')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Sahil Yolu No: 8')).toBeInTheDocument();

      fireEvent.change(screen.getByDisplayValue('Yazlık'), { target: { value: 'Villa' } });
      fireEvent.click(screen.getByRole('button', { name: 'Güncelle' }));

      expect(handleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'Villa',
          city: 'Muğla',
        }),
        'addr-1'
      );
      unmount();
    });

    it('validates required fields on address submission', () => {
      const handleSave = vi.fn();

      const { unmount } = renderWithRouter(
        <AddressFormModal
          isOpen={true}
          onClose={vi.fn()}
          addressToEdit={null}
          onSave={handleSave}
        />
      );

      const form = screen.getByPlaceholderText('Örn: Ev, Ofis, Atölye').closest('form')!;
      fireEvent.submit(form);
      expect(handleSave).not.toHaveBeenCalled();
      expect(screen.getByText('Lütfen alıcı ad ve soyadını giriniz.')).toBeInTheDocument();
      unmount();
    });

    it('renders error message when address onSave throws', async () => {
      const handleSave = vi.fn().mockRejectedValueOnce(new Error('Kayıt hatası oluştu'));

      const { unmount } = renderWithRouter(
        <AddressFormModal
          isOpen={true}
          onClose={vi.fn()}
          addressToEdit={{
            id: 'addr-1',
            user_id: 'u1',
            label: 'Ev',
            recipient_name: 'Ayşe',
            phone: '0555',
            address_line1: 'Adres',
            address_line2: null,
            district: null,
            city: 'İst',
            state_province: null,
            postal_code: '34000',
            country_code: 'TR',
            country_name: 'Türkiye',
            is_default_shipping: false,
            is_default_billing: false,
            created_at: '2026-08-28T00:00:00Z',
            updated_at: '2026-08-28T00:00:00Z',
          }}
          onSave={handleSave}
        />
      );

      const form = screen.getByPlaceholderText('Örn: Ev, Ofis, Atölye').closest('form')!;
      fireEvent.submit(form);

      expect(await screen.findByText('Kayıt hatası oluştu')).toBeInTheDocument();
      unmount();
    });

    it('handles country selector change', () => {
      const { unmount } = renderWithRouter(
        <AddressFormModal
          isOpen={true}
          onClose={vi.fn()}
          addressToEdit={null}
          onSave={vi.fn()}
        />
      );

      const countrySelect = screen.getByRole('combobox');
      fireEvent.change(countrySelect, { target: { value: 'DE' } });
      expect(countrySelect).toHaveValue('DE');
      unmount();
    });
  });
});

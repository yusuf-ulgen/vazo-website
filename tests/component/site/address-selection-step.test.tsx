import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { AddressSelectionStep } from '@/site/checkout/components/AddressSelectionStep';
import { CustomerAddress } from '@/entities/customer/types';
import { customerAuthStore } from '@/shared/stores/customer-auth-store';
import { renderWithRouter } from 'tests/utils/render-utils';

describe('AddressSelectionStep Component Tests', () => {
  const mockAddresses: CustomerAddress[] = [
    {
      id: 'addr-1',
      user_id: 'usr-1',
      label: 'Ev Adresi',
      recipient_name: 'Ahmet Yılmaz',
      phone: '5551112233',
      address_line1: 'Atatürk Cad. No: 10',
      district: 'Kadıköy',
      city: 'İstanbul',
      country_code: 'TR',
      country_name: 'Türkiye',
      is_default_shipping: true,
      is_default_billing: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'addr-2',
      user_id: 'usr-1',
      label: 'Atölye',
      recipient_name: 'Ahmet Usta',
      phone: '5552223344',
      address_line1: 'Sanayi Sit. No: 5',
      city: 'İzmir',
      country_code: 'TR',
      country_name: 'Türkiye',
      is_default_shipping: false,
      is_default_billing: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const onSelectAddress = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty address state and opens new address modal', () => {
    renderWithRouter(
      <AddressSelectionStep
        title="Teslimat Adresi"
        description="Lütfen teslimat adresi seçin."
        addresses={[]}
        selectedAddressId={null}
        onSelectAddress={onSelectAddress}
      />
    );

    expect(screen.getByText('Kayıtlı Adresiniz Bulunmuyor')).toBeInTheDocument();
    const addBtn = screen.getByRole('button', { name: /Yeni Adres Ekle/ });
    fireEvent.click(addBtn);

    expect(screen.getByRole('heading', { name: 'Yeni Adres Ekle' })).toBeInTheDocument();
  });

  it('renders addresses list and selects an address when clicked', () => {
    renderWithRouter(
      <AddressSelectionStep
        title="Teslimat Adresi"
        description="Lütfen teslimat adresi seçin."
        addresses={mockAddresses}
        selectedAddressId="addr-1"
        onSelectAddress={onSelectAddress}
      />
    );

    expect(screen.getByText('Ev Adresi')).toBeInTheDocument();
    expect(screen.getByText('Atölye')).toBeInTheDocument();
    expect(screen.getByText(/Kadıköy/)).toBeInTheDocument();

    const workshopCard = screen.getByText('Atölye');
    fireEvent.click(workshopCard);

    expect(onSelectAddress).toHaveBeenCalledWith(mockAddresses[1]);
  });

  it('handles saving a new address through modal and auto-selects it', async () => {
    const newAddress: CustomerAddress = {
      id: 'addr-new',
      user_id: 'usr-1',
      label: 'Yazlık',
      recipient_name: 'Ahmet Yazlık',
      phone: '5553334455',
      address_line1: 'Sahil Yolu No: 20',
      district: 'Bodrum',
      city: 'Muğla',
      country_code: 'TR',
      country_name: 'Türkiye',
      is_default_shipping: false,
      is_default_billing: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.spyOn(customerAuthStore, 'createAddress').mockResolvedValue(newAddress);

    renderWithRouter(
      <AddressSelectionStep
        title="Teslimat Adresi"
        description="Lütfen teslimat adresi seçin."
        addresses={mockAddresses}
        selectedAddressId="addr-1"
        onSelectAddress={onSelectAddress}
      />
    );

    const openAddModalBtn = screen.getByRole('button', { name: /\+ Yeni Adres Ekle/ });
    fireEvent.click(openAddModalBtn);

    const labelInput = screen.getByPlaceholderText(/Ev, Ofis, Atölye/);
    fireEvent.change(labelInput, { target: { value: 'Yazlık' } });

    const nameInput = screen.getByPlaceholderText('Ad Soyad');
    fireEvent.change(nameInput, { target: { value: 'Ahmet Yazlık' } });

    const phoneInput = screen.getByPlaceholderText('0555 123 45 67');
    fireEvent.change(phoneInput, { target: { value: '5553334455' } });

    const cityInput = screen.getByPlaceholderText('İstanbul');
    fireEvent.change(cityInput, { target: { value: 'Muğla' } });

    const postalCodeInput = screen.getByPlaceholderText('34710');
    fireEvent.change(postalCodeInput, { target: { value: '48400' } });

    const line1Input = screen.getByPlaceholderText('Mahalle, Cadde, Bina No, Kapı No');
    fireEvent.change(line1Input, { target: { value: 'Sahil Yolu No: 20' } });

    const form = screen.getByRole('dialog').querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(onSelectAddress).toHaveBeenCalledWith(newAddress);
    });
  });
});

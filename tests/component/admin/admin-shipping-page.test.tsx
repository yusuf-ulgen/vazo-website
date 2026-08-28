import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminShippingPage } from '@/admin/shipping/pages/AdminShippingPage';
import { adminShippingRepository } from '@/admin/shipping/api/admin-shipping-repository';
import { ShippingZone } from '@/entities/shipping/types';

vi.mock('@/admin/shipping/api/admin-shipping-repository', () => ({
  adminShippingRepository: {
    getZones: vi.fn(),
    createZone: vi.fn(),
    updateZone: vi.fn(),
    deleteZone: vi.fn(),
    addCountryToZone: vi.fn(),
    removeCountryFromZone: vi.fn(),
    createRate: vi.fn(),
    updateRate: vi.fn(),
    deleteRate: vi.fn(),
  },
}));

const mockZones: ShippingZone[] = [
  {
    id: 'z-tr-01',
    name: 'Türkiye İçi',
    description: 'Tüm Türkiye geneli teslimatlar',
    active: true,
    priority: 10,
    retail_enabled: true,
    wholesale_enabled: true,
    created_at: '2026-08-28T00:00:00Z',
    updated_at: '2026-08-28T00:00:00Z',
    countries: [
      {
        id: 'c-tr-01',
        zone_id: 'z-tr-01',
        country_code: 'TR',
        country_name: 'Türkiye',
        active: true,
        created_at: '2026-08-28T00:00:00Z',
      },
    ],
    rates: [
      {
        id: 'r-tr-01',
        zone_id: 'z-tr-01',
        name: 'Standart Yurtiçi Teslimat',
        currency: 'TRY',
        flat_amount_minor: 15000,
        free_shipping_threshold_minor: 500000,
        estimated_delivery_text: '2–4 İş Günü',
        active: true,
        priority: 10,
        created_at: '2026-08-28T00:00:00Z',
        updated_at: '2026-08-28T00:00:00Z',
      },
    ],
  },
];

describe('AdminShippingPage Component (Phase 3.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminShippingRepository.getZones).mockResolvedValue(mockZones);
  });

  it('renders page header, metrics, and loaded shipping zones', async () => {
    render(<AdminShippingPage />);

    expect(screen.getByText('Kargo ve Lojistik Yönetimi')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Türkiye İçi')).toBeInTheDocument();
      expect(screen.getByText('Tüm Türkiye geneli teslimatlar')).toBeInTheDocument();
      expect(screen.getByText('Standart Yurtiçi Teslimat')).toBeInTheDocument();
      expect(screen.getByText('TR')).toBeInTheDocument();
    });
  });

  it('opens ZoneFormModal when clicking "Yeni Bölge Ekle"', async () => {
    render(<AdminShippingPage />);

    await waitFor(() => {
      expect(screen.getByText('Türkiye İçi')).toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /Yeni Bölge Ekle/i });
    fireEvent.click(addBtn);

    expect(screen.getByRole('dialog', { name: 'Yeni Kargo Bölgesi' })).toBeInTheDocument();
  });

  it('opens CountryFormModal when clicking "Ülke Ekle"', async () => {
    render(<AdminShippingPage />);

    await waitFor(() => {
      expect(screen.getByText('Türkiye İçi')).toBeInTheDocument();
    });

    const addCountryBtn = screen.getByRole('button', { name: /Ülke Ekle/i });
    fireEvent.click(addCountryBtn);

    expect(screen.getByRole('dialog', { name: 'Bölgeye Ülke Ekle' })).toBeInTheDocument();
  });

  it('opens RateFormModal when clicking "Tarife Ekle"', async () => {
    render(<AdminShippingPage />);

    await waitFor(() => {
      expect(screen.getByText('Türkiye İçi')).toBeInTheDocument();
    });

    const addRateBtn = screen.getByRole('button', { name: /Tarife Ekle/i });
    fireEvent.click(addRateBtn);

    expect(screen.getByRole('dialog', { name: 'Yeni Kargo Tarifesi' })).toBeInTheDocument();
  });

  it('opens ConfirmDialog when clicking delete zone button', async () => {
    render(<AdminShippingPage />);

    await waitFor(() => {
      expect(screen.getByText('Türkiye İçi')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTitle('Bölgeyi Sil');
    fireEvent.click(deleteBtn);

    expect(screen.getByText('Kargo Bölgesini Sil')).toBeInTheDocument();
    expect(screen.getByText(/bölgesini ve bu bölgeye bağlı tüm ülke ve tarifeleri silmek istediğinizden emin misiniz/i)).toBeInTheDocument();
  });
});

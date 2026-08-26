import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PrivacyKvkkPolicyPage } from '@/site/pages/policies/PrivacyKvkkPolicyPage';
import { TermsOfServicePage } from '@/site/pages/policies/TermsOfServicePage';
import { ShippingReturnsPolicyPage } from '@/site/pages/policies/ShippingReturnsPolicyPage';

describe('Canonical Policy Pages', () => {
  it('renders Privacy & KVKK page with structured content', async () => {
    render(
      <MemoryRouter>
        <PrivacyKvkkPolicyPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Gizlilik Politikası & KVKK Aydınlatma Metni/)).toBeInTheDocument();
      expect(screen.getByText(/1. Veri Sorumlusu/)).toBeInTheDocument();
    });
  });

  it('renders Terms of Service page with structured content', async () => {
    render(
      <MemoryRouter>
        <TermsOfServicePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Kullanım Şartları & Mesafeli Sözleşme Genel İlkeleri|Mesafeli Satış & Kullanım Koşulları/)).toBeInTheDocument();
      expect(screen.getByText(/1. Fikri Mülkiyet & Telif Hakları/)).toBeInTheDocument();
    });
  });

  it('renders Shipping & Returns policy page with structured content', async () => {
    render(
      <MemoryRouter>
        <ShippingReturnsPolicyPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Kargo, Teslimat & İade Bilgilendirmesi|Teslimat & İade Koşulları/)).toBeInTheDocument();
      expect(screen.getByText(/1. Kargo & Teslimat Süreçleri|1. Kırılmaya Karşı %100 Güvenli Sevkiyat/)).toBeInTheDocument();
    });
  });
});

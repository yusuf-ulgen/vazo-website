import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { PreliminaryInfoPolicyPage } from '@/site/pages/policies/PreliminaryInfoPolicyPage';
import { DistanceSalesPolicyPage } from '@/site/pages/policies/DistanceSalesPolicyPage';
import { renderWithRouter } from 'tests/utils/render-utils';
import { contentRepository } from '@/entities/content';
import { settingsRepository } from '@/entities/settings/api/settings-repository';
import { DEFAULT_SELLER_LEGAL } from '@/entities/settings/types';

describe('Legal Policy Pages', () => {
  it('renders PreliminaryInfoPolicyPage with default fallback and custom sections', async () => {
    vi.spyOn(contentRepository, 'getContentPage').mockResolvedValueOnce({
      id: 'prelim-1',
      slug: 'preliminary_info',
      title: 'Özel Ön Bilgilendirme Koşulları',
      sections: [
        {
          id: 'sec-1',
          title: 'Özel Madde 1',
          content: 'Özel ön bilgilendirme içeriği.',
        },
      ],
      updatedAt: '2026-08-28T00:00:00Z',
    });

    renderWithRouter(<PreliminaryInfoPolicyPage />);
    expect(await screen.findByText('Özel Ön Bilgilendirme Koşulları')).toBeInTheDocument();
    expect(screen.getByText('Özel Madde 1')).toBeInTheDocument();
    expect(screen.getByText('Özel ön bilgilendirme içeriği.')).toBeInTheDocument();
  });

  it('renders PreliminaryInfoPolicyPage when repository errors and renders seller legal info', async () => {
    vi.spyOn(contentRepository, 'getContentPage').mockRejectedValueOnce(new Error('Network error'));
    vi.spyOn(settingsRepository, 'getSellerLegal').mockResolvedValueOnce({
      ...DEFAULT_SELLER_LEGAL,
      legal_trade_title: 'Monocactus Atölye',
      business_type: 'Şahıs Şirketi',
      tax_office: 'Beyoğlu',
      tax_number: '1234567890',
      registered_address: 'Karaköy No:1',
      kep_address: 'mono@hs01.kep.tr',
      business_phone: '5551234',
      business_email: 'info@mono.com',
    });

    renderWithRouter(<PreliminaryInfoPolicyPage />);
    expect(await screen.findByRole('heading', { level: 1, name: /Ön Bilgilendirme Koşulları/ })).toBeInTheDocument();
    expect(screen.getByText('1. Satıcı Bilgileri')).toBeInTheDocument();
    expect(screen.getByText('Monocactus Atölye')).toBeInTheDocument();
    expect(screen.getByText('Beyoğlu V.D. / 1234567890')).toBeInTheDocument();
    expect(screen.getByText('Tüm Satıcı & Yasal Bilgileri Görüntüle')).toBeInTheDocument();
  });

  it('renders PreliminaryInfoPolicyPage with empty seller legal data fallback dashes', async () => {
    vi.spyOn(contentRepository, 'getContentPage').mockRejectedValueOnce(new Error('Network error'));
    vi.spyOn(settingsRepository, 'getSellerLegal').mockResolvedValueOnce(DEFAULT_SELLER_LEGAL);

    renderWithRouter(<PreliminaryInfoPolicyPage />);
    expect(await screen.findByText('1. Satıcı Bilgileri')).toBeInTheDocument();
  });

  it('renders DistanceSalesPolicyPage with custom sections', async () => {
    vi.spyOn(contentRepository, 'getContentPage').mockResolvedValueOnce({
      id: 'dist-1',
      slug: 'distance_sales',
      title: 'Özel Mesafeli Satış Sözleşmesi',
      sections: [
        {
          id: 'sec-2',
          title: 'Özel Madde 2 — Teslimat Şartları',
          content: 'Özel teslimat şartları içeriği.',
        },
      ],
      updatedAt: '2026-08-28T00:00:00Z',
    });

    renderWithRouter(<DistanceSalesPolicyPage />);
    expect(await screen.findByText('Özel Mesafeli Satış Sözleşmesi')).toBeInTheDocument();
    expect(screen.getByText('Özel Madde 2 — Teslimat Şartları')).toBeInTheDocument();
  });

  it('renders DistanceSalesPolicyPage when repository errors and renders seller legal info', async () => {
    vi.spyOn(contentRepository, 'getContentPage').mockRejectedValueOnce(new Error('Network error'));
    vi.spyOn(settingsRepository, 'getSellerLegal').mockResolvedValueOnce({
      ...DEFAULT_SELLER_LEGAL,
      legal_trade_title: 'Monocactus Atölye',
      business_type: 'Şahıs Şirketi',
      tax_office: 'Beyoğlu',
      tax_number: '1234567890',
      registered_address: 'Karaköy No:1',
      kep_address: 'mono@hs01.kep.tr',
      business_phone: '5551234',
      business_email: 'info@mono.com',
    });

    renderWithRouter(<DistanceSalesPolicyPage />);
    expect(await screen.findByRole('heading', { level: 1, name: /Mesafeli Satış Sözleşmesi/ })).toBeInTheDocument();
    expect(screen.getByText('Madde 1 — Taraflar')).toBeInTheDocument();
    expect(screen.getByText('Monocactus Atölye')).toBeInTheDocument();
    expect(screen.getByText('Beyoğlu V.D. / 1234567890')).toBeInTheDocument();
    expect(screen.getByText('Tüm Satıcı & Yasal Bilgileri Görüntüle')).toBeInTheDocument();
  });

  it('renders DistanceSalesPolicyPage with empty seller legal data fallback dashes', async () => {
    vi.spyOn(contentRepository, 'getContentPage').mockRejectedValueOnce(new Error('Network error'));
    vi.spyOn(settingsRepository, 'getSellerLegal').mockResolvedValueOnce(DEFAULT_SELLER_LEGAL);

    renderWithRouter(<DistanceSalesPolicyPage />);
    expect(await screen.findByText('Madde 1 — Taraflar')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { PreliminaryInfoPolicyPage } from '@/site/pages/policies/PreliminaryInfoPolicyPage';
import { DistanceSalesPolicyPage } from '@/site/pages/policies/DistanceSalesPolicyPage';
import { renderWithRouter } from 'tests/utils/render-utils';
import { contentRepository } from '@/entities/content';

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

  it('renders PreliminaryInfoPolicyPage when repository errors', async () => {
    vi.spyOn(contentRepository, 'getContentPage').mockRejectedValueOnce(new Error('Network error'));
    renderWithRouter(<PreliminaryInfoPolicyPage />);
    expect(await screen.findByRole('heading', { level: 1, name: /Ön Bilgilendirme Koşulları/ })).toBeInTheDocument();
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

  it('renders DistanceSalesPolicyPage when repository errors', async () => {
    vi.spyOn(contentRepository, 'getContentPage').mockRejectedValueOnce(new Error('Network error'));
    renderWithRouter(<DistanceSalesPolicyPage />);
    expect(await screen.findByRole('heading', { level: 1, name: /Mesafeli Satış Sözleşmesi/ })).toBeInTheDocument();
  });
});

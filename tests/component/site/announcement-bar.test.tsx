import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { AnnouncementBar } from '@/site/components/AnnouncementBar';
import { renderWithRouter } from 'tests/utils/render-utils';
import { contentRepository } from '@/entities/content/api/content-repository';

describe('AnnouncementBar Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders announcement message from content repository and closes on dismiss', async () => {
    vi.spyOn(contentRepository, 'getAnnouncement').mockResolvedValue({
      isEnabled: true,
      message: 'Özel Duyuru Metni',
      linkText: 'İncele',
      linkUrl: '/wholesale',
    });

    renderWithRouter(<AnnouncementBar />);

    expect(await screen.findByText('Özel Duyuru Metni')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /İncele/ })).toHaveAttribute('href', '/wholesale');

    const closeBtn = screen.getByRole('button', { name: 'Duyuruyu Kapat' });
    fireEvent.click(closeBtn);

    expect(screen.queryByText('Özel Duyuru Metni')).not.toBeInTheDocument();
  });

  it('falls back to default link when linkUrl is not provided', async () => {
    vi.spyOn(contentRepository, 'getAnnouncement').mockResolvedValue({
      isEnabled: true,
      message: 'Link urlsiz duyuru',
      linkText: 'Detay',
    });

    renderWithRouter(<AnnouncementBar />);

    expect(await screen.findByText('Link urlsiz duyuru')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Detay/ })).toHaveAttribute('href', '/products');
  });

  it('renders dynamic free shipping notice when announcement is null and dismisses on close', async () => {
    vi.spyOn(contentRepository, 'getAnnouncement').mockResolvedValue(null);

    renderWithRouter(<AnnouncementBar />);

    expect(await screen.findByText(/ve Üzeri Siparişlerde Kargo Ücretsiz/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Alışverişe Başla/ })).toHaveAttribute('href', '/products');

    const closeBtn = screen.getByRole('button', { name: 'Duyuruyu Kapat' });
    fireEvent.click(closeBtn);

    expect(screen.queryByText(/ve Üzeri Siparişlerde Kargo Ücretsiz/)).not.toBeInTheDocument();
  });
});

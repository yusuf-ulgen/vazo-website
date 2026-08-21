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

  it('falls back to /wholesale link when linkUrl is not provided', async () => {
    vi.spyOn(contentRepository, 'getAnnouncement').mockResolvedValue({
      isEnabled: true,
      message: 'Link urlsiz duyuru',
      linkText: 'Detay',
    });

    renderWithRouter(<AnnouncementBar />);

    expect(await screen.findByText('Link urlsiz duyuru')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Detay/ })).toHaveAttribute('href', '/wholesale');
  });

  it('does not render when announcement is inactive or null', async () => {
    vi.spyOn(contentRepository, 'getAnnouncement').mockResolvedValue(null);

    const { container } = renderWithRouter(<AnnouncementBar />);
    expect(container.firstChild).toBeNull();
  });
});

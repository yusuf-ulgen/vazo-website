import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { AboutPage } from '@/site/pages/AboutPage';
import { renderWithRouter } from 'tests/utils/render-utils';
import { contentRepository } from '@/entities/content';

describe('AboutPage Component', () => {
  it('renders default fallback when content repository errors', async () => {
    vi.spyOn(contentRepository, 'getContentPage').mockRejectedValueOnce(new Error('Network error'));

    renderWithRouter(<AboutPage />);

    expect(await screen.findByText('Felsefemiz & Atölyemiz')).toBeInTheDocument();
    expect(screen.getByText('01 / Geleneksel Zanaat')).toBeInTheDocument();
    expect(screen.getByText('02 / Malzeme ve Doku')).toBeInTheDocument();
    expect(screen.getByText('Stüdyomuzu Şekillendiren İlkeler')).toBeInTheDocument();
  });

  it('renders custom sections when content repository returns page data', async () => {
    vi.spyOn(contentRepository, 'getContentPage').mockResolvedValueOnce({
      id: 'about-custom',
      slug: 'about',
      title: 'Özel Hakkımızda Başlığı',
      seoTitle: 'Özel SEO Başlık',
      seoDescription: 'Özel SEO Açıklama',
      sections: [
        {
          id: 'sec-hero',
          sectionKey: 'hero_header',
          eyebrow: 'Özel Eyebrow',
          title: 'Özel Hero Başlığı',
          content: 'Özel hero içeriği.',
        },
        {
          id: 'sec-craft',
          sectionKey: 'story_craft',
          eyebrow: 'Özel Zanaat',
          title: 'Özel Zanaat Başlığı',
          content: 'Özel zanaat metni.',
          imageUrl: 'https://example.com/craft.jpg',
        },
        {
          id: 'sec-material',
          sectionKey: 'story_material',
          eyebrow: 'Özel Malzeme',
          title: 'Özel Malzeme Başlığı',
          content: 'Özel malzeme metni.',
          imageUrl: 'https://example.com/material.jpg',
          ctaText: 'Keşfet',
          ctaUrl: '/catalog',
        },
      ],
      updatedAt: '2026-08-28T00:00:00Z',
    });

    renderWithRouter(<AboutPage />);

    expect(await screen.findByText('Özel Hero Başlığı')).toBeInTheDocument();
    expect(screen.getByText('Özel Eyebrow')).toBeInTheDocument();
    expect(screen.getByText('Özel Zanaat Başlığı')).toBeInTheDocument();
    expect(screen.getByText('Özel Malzeme Başlığı')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Keşfet/ })).toHaveAttribute('href', '/catalog');
  });
});

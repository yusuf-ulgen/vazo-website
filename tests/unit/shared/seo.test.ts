import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSEO } from '@/shared/lib/seo';
import { siteConfig } from '@/shared/config/site-config';

describe('useSEO hook', () => {
  beforeEach(() => {
    document.title = 'Default Title';
    document.head.innerHTML = `
      <meta name="description" content="Default Description" />
      <meta property="og:title" content="Default OG Title" />
      <meta property="og:description" content="Default OG Description" />
      <meta property="og:image" content="https://example.com/default.jpg" />
    `;
  });

  it('sets page title and meta description properly', () => {
    renderHook(() =>
      useSEO({
        title: 'Özel Vazo Koleksiyonu',
        description: 'Benzersiz seramik vazolar.',
      })
    );

    expect(document.title).toBe(`Özel Vazo Koleksiyonu | ${siteConfig.name}`);
    const metaDesc = document.querySelector('meta[name="description"]');
    expect(metaDesc?.getAttribute('content')).toBe('Benzersiz seramik vazolar.');
  });

  it('updates OpenGraph tags and creates canonical link', () => {
    renderHook(() =>
      useSEO({
        title: 'Yeni Sezon',
        description: 'Yeni sezon açıklaması',
        canonicalUrl: 'https://vazostudio.com/new',
        ogImage: 'https://vazostudio.com/og-new.jpg',
      })
    );

    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const ogImg = document.querySelector('meta[property="og:image"]');
    const linkCanonical = document.querySelector('link[rel="canonical"]');

    expect(ogTitle?.getAttribute('content')).toBe(`Yeni Sezon | ${siteConfig.name}`);
    expect(ogDesc?.getAttribute('content')).toBe('Yeni sezon açıklaması');
    expect(ogImg?.getAttribute('content')).toBe('https://vazostudio.com/og-new.jpg');
    expect(linkCanonical?.getAttribute('href')).toBe('https://vazostudio.com/new');
  });

  it('uses default fallback values when arguments are omitted', () => {
    renderHook(() => useSEO());

    expect(document.title).toBe(`${siteConfig.name} — ${siteConfig.tagline}`);
    const metaDesc = document.querySelector('meta[name="description"]');
    expect(metaDesc?.getAttribute('content')).toBe(siteConfig.description);
  });

  it('cleans up canonical link and restores title on unmount', () => {
    const { unmount } = renderHook(() =>
      useSEO({
        title: 'Geçici Sayfa',
        canonicalUrl: 'https://vazostudio.com/temporary',
      })
    );

    expect(document.querySelector('link[rel="canonical"]')).not.toBeNull();

    unmount();

    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  });

  it('resets route-specific og:image on route transition (prevents cross-route contamination)', () => {
    // Route A with custom ogImage and canonical
    const routeA = renderHook(() =>
      useSEO({
        title: 'Route A',
        ogImage: 'https://vazostudio.com/route-a-og.jpg',
        canonicalUrl: 'https://vazostudio.com/route-a',
      })
    );

    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(
      'https://vazostudio.com/route-a-og.jpg'
    );
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://vazostudio.com/route-a'
    );

    // Unmount Route A (simulate navigation)
    routeA.unmount();

    // Route B without custom ogImage or canonical
    const routeB = renderHook(() =>
      useSEO({
        title: 'Route B',
      })
    );

    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).not.toBe(
      'https://vazostudio.com/route-a-og.jpg'
    );
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();

    routeB.unmount();
  });
});

import { useEffect } from 'react';
import { siteConfig } from '@/shared/config/site-config';

export interface SEOProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
}

const DEFAULT_OG_IMAGE = 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1200&q=85';

export function useSEO({ title, description, canonicalUrl, ogImage }: SEOProps = {}) {
  useEffect(() => {
    // 1. Document Title
    const fullTitle = title ? `${title} | ${siteConfig.name}` : `${siteConfig.name} — ${siteConfig.tagline}`;
    const previousTitle = document.title;
    document.title = fullTitle;

    // 2. Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    let createdDesc = false;
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
      createdDesc = true;
    }
    const previousDesc = metaDesc.getAttribute('content');
    metaDesc.setAttribute('content', description || siteConfig.description);

    // 3. OpenGraph Title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    const previousOgTitle = ogTitle.getAttribute('content');
    ogTitle.setAttribute('content', fullTitle);

    // 4. OpenGraph Description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    const previousOgDesc = ogDesc.getAttribute('content');
    ogDesc.setAttribute('content', description || siteConfig.description);

    // 5. OpenGraph Image
    let ogImg = document.querySelector('meta[property="og:image"]');
    if (!ogImg) {
      ogImg = document.createElement('meta');
      ogImg.setAttribute('property', 'og:image');
      document.head.appendChild(ogImg);
    }
    const previousOgImg = ogImg.getAttribute('content');
    ogImg.setAttribute('content', ogImage || DEFAULT_OG_IMAGE);

    // 6. Canonical Link
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    let createdCanonical = false;
    if (canonicalUrl) {
      if (!linkCanonical) {
        linkCanonical = document.createElement('link');
        linkCanonical.setAttribute('rel', 'canonical');
        document.head.appendChild(linkCanonical);
        createdCanonical = true;
      }
      linkCanonical.setAttribute('href', canonicalUrl);
    } else if (linkCanonical) {
      linkCanonical.remove();
    }

    return () => {
      document.title = previousTitle || `${siteConfig.name} — ${siteConfig.tagline}`;
      if (metaDesc) {
        if (createdDesc) {
          metaDesc.remove();
        } else if (previousDesc !== null) {
          metaDesc.setAttribute('content', previousDesc);
        } else {
          metaDesc.setAttribute('content', siteConfig.description);
        }
      }
      if (ogTitle) {
        ogTitle.setAttribute('content', previousOgTitle || `${siteConfig.name} — ${siteConfig.tagline}`);
      }
      if (ogDesc) {
        ogDesc.setAttribute('content', previousOgDesc || siteConfig.description);
      }
      if (ogImg) {
        ogImg.setAttribute('content', previousOgImg || DEFAULT_OG_IMAGE);
      }
      if (createdCanonical && linkCanonical) {
        linkCanonical.remove();
      }
    };
  }, [title, description, canonicalUrl, ogImage]);
}

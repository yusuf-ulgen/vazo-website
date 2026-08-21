import { useEffect } from 'react';
import { siteConfig } from '@/shared/config/site-config';

export interface SEOProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
}

export function useSEO({ title, description, canonicalUrl, ogImage }: SEOProps = {}) {
  useEffect(() => {
    // Update document title
    const fullTitle = title ? `${title} | ${siteConfig.name}` : `${siteConfig.name} — ${siteConfig.tagline}`;
    const previousTitle = document.title;
    document.title = fullTitle;

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    const previousDesc = metaDesc?.getAttribute('content') || null;
    if (metaDesc) {
      metaDesc.setAttribute('content', description || siteConfig.description);
    }

    // Update OpenGraph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', fullTitle);
    }

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute('content', description || siteConfig.description);
    }

    const ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImage && ogImg) {
      ogImg.setAttribute('content', ogImage);
    }

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
      if (metaDesc && previousDesc) {
        metaDesc.setAttribute('content', previousDesc);
      }
      if (createdCanonical && linkCanonical) {
        linkCanonical.remove();
      }
    };
  }, [title, description, canonicalUrl, ogImage]);
}

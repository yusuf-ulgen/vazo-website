/**
 * Production Canonical Domain & Origin Management.
 * Canonical production origin: https://shop.monocactus.com
 * Provides deterministic URL builders for SEO canonical links, OAuth redirects, and PayTR return endpoints.
 */

export const CANONICAL_PRODUCTION_ORIGIN = 'https://shop.monocactus.com';

/**
 * Resolves the operational origin for the current runtime environment.
 * In production builds, defaults to CANONICAL_PRODUCTION_ORIGIN if not explicitly set.
 */
export function getAppOrigin(): string {
  // 1. Explicit Vite environment configuration
  const envOrigin =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_ORIGIN) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL);

  if (envOrigin && typeof envOrigin === 'string' && envOrigin.trim() !== '') {
    return normalizeOrigin(envOrigin.trim());
  }

  // 2. Browser window location
  if (typeof window !== 'undefined' && window.location?.origin) {
    const browserOrigin = window.location.origin;
    // Allow localhost/127.0.0.1 for local development
    if (browserOrigin.includes('localhost') || browserOrigin.includes('127.0.0.1')) {
      return browserOrigin;
    }
    return normalizeOrigin(browserOrigin);
  }

  return CANONICAL_PRODUCTION_ORIGIN;
}

/**
 * Normalizes an origin string: ensures no trailing slash and enforces HTTPS for production hosts.
 */
export function normalizeOrigin(origin: string): string {
  if (!origin || typeof origin !== 'string') return CANONICAL_PRODUCTION_ORIGIN;
  let cleaned = origin.trim().replace(/\/+$/, '');
  if (!cleaned) return CANONICAL_PRODUCTION_ORIGIN;

  // If origin points to production domain without https, enforce https
  if (cleaned.startsWith('http://shop.monocactus.com')) {
    cleaned = cleaned.replace('http://', 'https://');
  }

  return cleaned;
}

/**
 * Generates an authoritative canonical URL for SEO and OpenGraph metadata.
 */
export function getCanonicalUrl(pathname: string = '/'): string {
  const base = CANONICAL_PRODUCTION_ORIGIN;
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${base}${cleanPath}`;
}

/**
 * Builds PayTR success and failure callback redirect URLs.
 * Strictly enforces HTTPS in production environments.
 */
export function getPaytrReturnUrls(
  orderId: string,
  customOrigin?: string
): { merchantOkUrl: string; merchantFailUrl: string } {
  if (!orderId) {
    throw new Error('Sipariş kimliği (orderId) gereklidir.');
  }

  const base = customOrigin ? normalizeOrigin(customOrigin) : getAppOrigin();

  // Guard: In production domain, never allow insecure HTTP callback
  if (base.includes('monocactus.com') && !base.startsWith('https://')) {
    throw new Error('Üretim ortamında PayTR dönüş adresleri için HTTPS zorunludur.');
  }

  const cleanOrderId = encodeURIComponent(orderId.trim());

  return {
    merchantOkUrl: `${base}/payment/success?order_id=${cleanOrderId}`,
    merchantFailUrl: `${base}/payment/failure?order_id=${cleanOrderId}`,
  };
}

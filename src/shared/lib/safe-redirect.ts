const AUTH_REDIRECT_KEY = 'vazo_auth_redirect';

/**
 * Validates whether a provided redirect path is a safe internal application route.
 * Strictly prevents open-redirect vulnerabilities (e.g., protocol injection, double slash relative URLs).
 */
export function getSafeRedirectUrl(target?: string | null, fallback = '/account'): string {
  if (!target || typeof target !== 'string') {
    return fallback;
  }

  const trimmed = target.trim();

  // Must start with exactly one '/' and NOT '//' (protocol-relative URL)
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }

  // Reject URLs containing protocol prefixes or backslashes
  if (trimmed.includes('://') || trimmed.includes('\\') || trimmed.includes(':')) {
    return fallback;
  }

  // Ensure path is URL-parseable relative to an arbitrary base
  try {
    const parsed = new URL(trimmed, 'https://shop.monocactus.com');
    // Origin must match the base
    if (parsed.origin !== 'https://shop.monocactus.com') {
      return fallback;
    }
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return fallback;
  }
}

/**
 * Persists intended navigation destination before initiating Google OAuth flow.
 */
export function saveAuthRedirect(path: string): void {
  if (typeof window === 'undefined') return;
  const safePath = getSafeRedirectUrl(path, '/account');
  try {
    sessionStorage.setItem(AUTH_REDIRECT_KEY, safePath);
  } catch {
    // Ignore sessionStorage errors (e.g. private mode quota)
  }
}

/**
 * Retrieves and clears the intended post-OAuth destination.
 */
export function getAndClearAuthRedirect(fallback = '/account'): string {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = sessionStorage.getItem(AUTH_REDIRECT_KEY);
    sessionStorage.removeItem(AUTH_REDIRECT_KEY);
    return getSafeRedirectUrl(raw, fallback);
  } catch {
    return fallback;
  }
}

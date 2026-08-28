import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSafeRedirectUrl,
  saveAuthRedirect,
  getAndClearAuthRedirect,
} from '@/shared/lib/safe-redirect';

describe('Safe Redirect Utility (Open Redirect Attack Prevention)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('allows valid internal relative paths', () => {
    expect(getSafeRedirectUrl('/cart')).toBe('/cart');
    expect(getSafeRedirectUrl('/checkout')).toBe('/checkout');
    expect(getSafeRedirectUrl('/account')).toBe('/account');
    expect(getSafeRedirectUrl('/account/addresses')).toBe('/account/addresses');
    expect(getSafeRedirectUrl('/products/vazo-01?variant=v1')).toBe('/products/vazo-01?variant=v1');
    expect(getSafeRedirectUrl('/collections/artisan#details')).toBe('/collections/artisan#details');
  });

  it('strictly rejects external URLs with protocols and falls back', () => {
    expect(getSafeRedirectUrl('https://evil.example.com')).toBe('/account');
    expect(getSafeRedirectUrl('http://attacker.com/steal')).toBe('/account');
    expect(getSafeRedirectUrl('javascript:alert(1)')).toBe('/account');
    expect(getSafeRedirectUrl('data:text/html,<script>alert(1)</script>')).toBe('/account');
  });

  it('strictly rejects protocol-relative URLs (//evil.com)', () => {
    expect(getSafeRedirectUrl('//evil.com')).toBe('/account');
    expect(getSafeRedirectUrl('//evil.com/phishing')).toBe('/account');
    expect(getSafeRedirectUrl('///evil.com')).toBe('/account');
  });

  it('rejects backslash injection and windows path notation', () => {
    expect(getSafeRedirectUrl('/\\evil.com')).toBe('/account');
    expect(getSafeRedirectUrl('\\evil.com')).toBe('/account');
  });

  it('handles null, undefined, empty, and non-string inputs with custom fallback', () => {
    expect(getSafeRedirectUrl(null, '/cart')).toBe('/cart');
    expect(getSafeRedirectUrl(undefined, '/')).toBe('/');
    expect(getSafeRedirectUrl('', '/products')).toBe('/products');
    expect(getSafeRedirectUrl('   ', '/account')).toBe('/account');
  });

  it('correctly persists and clears redirect destination across OAuth roundtrip', () => {
    saveAuthRedirect('/checkout?step=shipping');
    const retrieved = getAndClearAuthRedirect('/account');
    expect(retrieved).toBe('/checkout?step=shipping');

    // Second call should return fallback since storage was cleared
    const secondCall = getAndClearAuthRedirect('/account');
    expect(secondCall).toBe('/account');
  });

  it('cleans malicious values stored in sessionStorage on retrieval', () => {
    sessionStorage.setItem('vazo_auth_redirect', 'https://malicious.org');
    const retrieved = getAndClearAuthRedirect('/account');
    expect(retrieved).toBe('/account');
  });

  it('safely handles sessionStorage throwing exceptions', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });
    expect(() => saveAuthRedirect('/cart')).not.toThrow();
    setItemSpy.mockRestore();

    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(getAndClearAuthRedirect('/fallback')).toBe('/fallback');
    getItemSpy.mockRestore();
  });

  it('uses default fallback /account when no fallback argument is provided', () => {
    expect(getSafeRedirectUrl('//invalid')).toBe('/account');
    expect(getAndClearAuthRedirect()).toBe('/account');
  });
});

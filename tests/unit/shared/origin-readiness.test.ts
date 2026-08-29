import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  CANONICAL_PRODUCTION_ORIGIN,
  normalizeOrigin,
  getAppOrigin,
  getCanonicalUrl,
  getPaytrReturnUrls,
} from '@/shared/lib/origin';

describe('Origin & HTTPS Safety Utilities (Phase 3.10)', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllEnvs();
  });

  it('declares canonical production origin as https://shop.monocactus.com', () => {
    expect(CANONICAL_PRODUCTION_ORIGIN).toBe('https://shop.monocactus.com');
  });

  it('resolves app origin correctly in test/browser environment', () => {
    const origin = getAppOrigin();
    expect(origin.startsWith('http://') || origin.startsWith('https://')).toBe(true);
  });

  it('normalizes origins by stripping trailing slashes and converting monocactus to https', () => {
    expect(normalizeOrigin('http://shop.monocactus.com/')).toBe('https://shop.monocactus.com');
    expect(normalizeOrigin('https://shop.monocactus.com///')).toBe('https://shop.monocactus.com');
    expect(normalizeOrigin('http://localhost:5173/')).toBe('http://localhost:5173');
    expect(normalizeOrigin('')).toBe('https://shop.monocactus.com');
  });

  it('builds canonical URLs with canonical production origin', () => {
    expect(getCanonicalUrl('/seller-information')).toBe('https://shop.monocactus.com/seller-information');
    expect(getCanonicalUrl('policies/privacy-kvkk')).toBe('https://shop.monocactus.com/policies/privacy-kvkk');
    expect(getCanonicalUrl('')).toBe('https://shop.monocactus.com/');
  });

  it('builds PayTR merchant OK and Fail return URLs enforcing HTTPS in production', () => {
    const urls = getPaytrReturnUrls('ord-12345', 'https://shop.monocactus.com');
    expect(urls.merchantOkUrl).toBe('https://shop.monocactus.com/payment/success?order_id=ord-12345');
    expect(urls.merchantFailUrl).toBe('https://shop.monocactus.com/payment/failure?order_id=ord-12345');
    expect(urls.merchantOkUrl.startsWith('https://')).toBe(true);
    expect(urls.merchantFailUrl.startsWith('https://')).toBe(true);
  });

  it('upgrades insecure monocactus http customOrigin to https', () => {
    const urls = getPaytrReturnUrls('ord-99999', 'http://shop.monocactus.com');
    expect(urls.merchantOkUrl).toBe('https://shop.monocactus.com/payment/success?order_id=ord-99999');
    expect(urls.merchantFailUrl).toBe('https://shop.monocactus.com/payment/failure?order_id=ord-99999');
  });

  it('preserves localhost origin during development tests', () => {
    const urls = getPaytrReturnUrls('ord-local-01', 'http://localhost:5173');
    expect(urls.merchantOkUrl).toBe('http://localhost:5173/payment/success?order_id=ord-local-01');
    expect(urls.merchantFailUrl).toBe('http://localhost:5173/payment/failure?order_id=ord-local-01');
  });
});

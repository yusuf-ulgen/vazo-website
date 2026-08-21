import { describe, it, expect } from 'vitest';
import { siteConfig } from '@/shared/config/site-config';

describe('siteConfig configuration object', () => {
  it('contains valid branding and studio details', () => {
    expect(siteConfig.name).toBe('Vazo Studio');
    expect(siteConfig.contact.email).toContain('@');
    expect(siteConfig.contact.phone).toBeDefined();
    expect(siteConfig.contact.address).toBeDefined();
    expect(siteConfig.announcement.enabled).toBe(true);
    expect(siteConfig.announcement.actionUrl).toBe('/wholesale');
  });
});

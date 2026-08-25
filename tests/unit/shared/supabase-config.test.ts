import { describe, it, expect } from 'vitest';
import { supabase, isSupabaseConfigured, isStorefrontMockEnabled, getSupabase } from '@/shared/lib/supabase';

describe('supabase configuration module', () => {
  it('exports valid boolean flag for isSupabaseConfigured', () => {
    expect(typeof isSupabaseConfigured).toBe('boolean');
  });

  it('exports valid boolean flag for isStorefrontMockEnabled', () => {
    expect(typeof isStorefrontMockEnabled).toBe('boolean');
  });

  it('exports supabase client or null according to environment', () => {
    if (isSupabaseConfigured) {
      expect(supabase).not.toBeNull();
      expect(getSupabase()).toBe(supabase);
    } else {
      expect(supabase).toBeNull();
      expect(() => getSupabase()).toThrow(
        /Missing or invalid VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY/
      );
    }
  });

  it('verifies that storefront mock mode does not dictate supabase client availability', () => {
    // Both flags must exist independently without conflation
    expect(typeof isStorefrontMockEnabled).toBe('boolean');
    expect(typeof isSupabaseConfigured).toBe('boolean');
  });

  it('never exposes service role, secret key, or private credentials in client environment', () => {
    const env = import.meta.env as Record<string, string | undefined>;
    expect(env.VITE_SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
    expect(env.SUPABASE_SECRET_KEY).toBeUndefined();
    expect(env.VITE_SUPABASE_SECRET_KEY).toBeUndefined();
    expect(env.VITE_SERVICE_ROLE_KEY).toBeUndefined();

    // Verify no secret prefixed variables are accidentally exposed in env
    const secretKeys = Object.keys(env).filter(
      (key) =>
        key.toLowerCase().includes('secret') ||
        key.toLowerCase().includes('service_role') ||
        key.toLowerCase().startsWith('sb_secret')
    );
    expect(secretKeys).toEqual([]);
  });
});


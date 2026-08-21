import { describe, it, expect } from 'vitest';
import { supabase, isSupabaseConfigured, getSupabase } from '@/shared/lib/supabase';

describe('supabase configuration module', () => {
  it('exports valid boolean flag for isSupabaseConfigured', () => {
    expect(typeof isSupabaseConfigured).toBe('boolean');
  });

  it('exports supabase client or null according to environment', () => {
    if (isSupabaseConfigured) {
      expect(supabase).not.toBeNull();
      expect(getSupabase()).toBe(supabase);
    } else {
      expect(supabase).toBeNull();
      expect(() => getSupabase()).toThrow(/Supabase/);
    }
  });

  it('never expects service role or secret key in client environment', () => {
    const env = import.meta.env as Record<string, string | undefined>;
    expect(env.VITE_SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
    expect(env.SUPABASE_SECRET_KEY).toBeUndefined();
  });
});

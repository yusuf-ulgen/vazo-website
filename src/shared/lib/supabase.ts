import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

const isMockEnabled =
  import.meta.env.VITE_ENABLE_MOCK_DATA === 'true' ||
  !supabaseUrl ||
  !supabasePublishableKey ||
  supabaseUrl.includes('your-project');

/**
 * Initializes the client-side Supabase instance.
 * Uses only public environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY).
 * Never uses secret/service-role credentials in client-side code.
 */
let clientInstance: SupabaseClient | null = null;

if (!isMockEnabled && supabaseUrl && supabasePublishableKey) {
  clientInstance = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export const isSupabaseConfigured = Boolean(clientInstance);

/**
 * Safe accessor for the Supabase client.
 * Throws a clear error if invoked while Supabase credentials are not configured
 * and mock mode is disabled.
 */
export function getSupabase(): SupabaseClient {
  if (!clientInstance) {
    if (isMockEnabled) {
      throw new Error(
        'Supabase client is not initialized because VITE_ENABLE_MOCK_DATA is active or Supabase credentials are not set in .env.local.'
      );
    }
    throw new Error(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in environment variables.'
    );
  }
  return clientInstance;
}

export const supabase = clientInstance;

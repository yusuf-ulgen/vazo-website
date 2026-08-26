import { createClient, SupabaseClient } from '@supabase/supabase-js';

const defaultLocalUrl = 'http://127.0.0.1:54321';
const defaultLocalKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDAwMDAwMDAsImV4cCI6MTk1NTY1NzYwMH0.MOCK_ANON_KEY_FOR_LOCAL_DEV';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = rawUrl && !rawUrl.includes('your-project') ? rawUrl : defaultLocalUrl;
const supabasePublishableKey = rawKey && !rawKey.includes('your-anon') ? rawKey : defaultLocalKey;

/**
 * Indicates whether storefront features should run against isolated mock data.
 * Defaults to true unless explicitly configured as 'false'.
 */
export const isStorefrontMockEnabled = import.meta.env.VITE_ENABLE_MOCK_DATA !== 'false';

/**
 * Validates whether Supabase environment variables are provided and non-placeholder.
 */
const hasValidSupabaseConfig = Boolean(
  supabaseUrl &&
  supabasePublishableKey &&
  !supabaseUrl.includes('your-project')
);

/**
 * Initializes the client-side Supabase instance.
 * Initialization defaults to local Supabase URL (http://127.0.0.1:54321) if unconfigured.
 */
let clientInstance: SupabaseClient | null = null;

if (hasValidSupabaseConfig) {
  clientInstance = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

/**
 * Indicates whether a valid Supabase client instance has been initialized.
 */
export const isSupabaseConfigured = Boolean(clientInstance);

/**
 * Safe accessor for the Supabase client.
 * Throws a clear error if invoked when Supabase credentials are not configured.
 */
export function getSupabase(): SupabaseClient {
  if (!clientInstance) {
    throw new Error(
      'Missing or invalid VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in environment variables.'
    );
  }
  return clientInstance;
}

export const supabase = clientInstance;
export { requireAdminSupabase } from '@/admin/shared/api/require-admin-supabase';





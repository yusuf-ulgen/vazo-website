import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

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
 * Initialization depends ONLY on valid Supabase URL and Publishable/Anon key.
 * VITE_ENABLE_MOCK_DATA does NOT prevent Supabase from initializing.
 */
let clientInstance: SupabaseClient | null = null;

if (hasValidSupabaseConfig) {
  clientInstance = createClient(supabaseUrl!, supabasePublishableKey!, {
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


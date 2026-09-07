import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_LOCAL_DEV_URL = 'http://127.0.0.1:54321';
export const DEFAULT_LOCAL_DEV_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDAwMDAwMDAsImV4cCI6MTk1NTY1NzYwMH0.MOCK_ANON_KEY_FOR_LOCAL_DEV';

export interface SupabaseConfigParams {
  isProd?: boolean;
  mode?: string;
  enableMockData?: string;
  supabaseUrl?: string;
  publishableKey?: string;
  anonKey?: string;
  hostname?: string;
}

/**
 * Pure resolver for Supabase configuration and mock commerce boundaries.
 * Enforces that production never silently enables mock commerce or defaults to local dev URLs.
 */
export function resolveSupabaseConfig(params: SupabaseConfigParams = {}) {
  const isProd =
    params.isProd !== undefined
      ? params.isProd
      : Boolean(import.meta.env.PROD || import.meta.env.MODE === 'production');

  const enableMockData =
    params.enableMockData !== undefined
      ? params.enableMockData
      : import.meta.env.VITE_ENABLE_MOCK_DATA;

  const rawUrl = (
    params.supabaseUrl !== undefined
      ? params.supabaseUrl
      : import.meta.env.VITE_SUPABASE_URL
  )?.trim();

  const rawKey = (
    params.publishableKey !== undefined
      ? params.publishableKey
      : params.anonKey !== undefined
      ? params.anonKey
      : import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
  )?.trim();

  // In production, mock mode MUST NEVER become enabled merely because an env variable was omitted.
  // It is ONLY enabled if explicitly configured with 'true' (e.g. for preview staging).
  // In development / local mode, mock mode defaults to true unless explicitly configured as 'false'.
  const isStorefrontMockEnabled = isProd
    ? enableMockData === 'true'
    : enableMockData !== 'false';

  // In production, NEVER fall back to local dev URL or local demo key.
  const supabaseUrl =
    rawUrl && !rawUrl.includes('your-project')
      ? rawUrl
      : !isProd
      ? DEFAULT_LOCAL_DEV_URL
      : '';

  const supabasePublishableKey =
    rawKey && !rawKey.includes('your-anon')
      ? rawKey
      : !isProd
      ? DEFAULT_LOCAL_DEV_KEY
      : '';

  let hasValidConfig = Boolean(
    supabaseUrl &&
    supabasePublishableKey &&
    !supabaseUrl.includes('your-project') &&
    !supabasePublishableKey.includes('your-anon')
  );

  if (isProd && hasValidConfig) {
    // In production, reject the local dev demo key
    if (supabasePublishableKey === DEFAULT_LOCAL_DEV_KEY) {
      hasValidConfig = false;
    }
    // On a real browser production origin, reject loopback/127.0.0.1/localhost URL
    const hostname =
      params.hostname !== undefined
        ? params.hostname
        : typeof window !== 'undefined'
        ? window.location.hostname
        : '';
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '';

    if (!isLocalhost && (supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost'))) {
      hasValidConfig = false;
    }
  }

  return {
    isStorefrontMockEnabled,
    supabaseUrl: hasValidConfig ? supabaseUrl : '',
    supabasePublishableKey: hasValidConfig ? supabasePublishableKey : '',
    hasValidConfig,
  };
}

const config = resolveSupabaseConfig();

/**
 * Indicates whether storefront features should run against isolated mock data.
 */
export const isStorefrontMockEnabled = config.isStorefrontMockEnabled;

let clientInstance: SupabaseClient | null = null;

if (config.hasValidConfig) {
  clientInstance = createClient(config.supabaseUrl, config.supabasePublishableKey, {
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





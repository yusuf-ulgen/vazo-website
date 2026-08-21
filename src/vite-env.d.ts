/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_ENV?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ENABLE_MOCK_DATA?: string;
  readonly VITE_ENABLE_WHOLESALE_FLOW?: string;
  readonly VITE_ENABLE_ADMIN_PANEL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

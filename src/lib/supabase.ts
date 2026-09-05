import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Project configuration must come from environment variables. There is no
// hardcoded fallback: shipping without real config should fail loudly rather
// than silently connecting to a fixed project.
const SUPABASE_PROJECT_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_PROJECT_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
}

// Lazy client holder
let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseClient;
}

export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_PROJECT_URL && SUPABASE_ANON_KEY);
};

export const SUPABASE_URL_DISPLAY = SUPABASE_PROJECT_URL;
export const SUPABASE_ANON_KEY_DISPLAY = SUPABASE_ANON_KEY;

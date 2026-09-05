import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Prefer environment variables; fall back to project defaults so deploys
// that haven't configured env vars yet don't break with a blank screen.
const SUPABASE_PROJECT_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://ylyfpatonnplpmvmrsji.supabase.co';

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlseWZwYXRvbm5wbHBtdm1yc2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5MDA0ODYsImV4cCI6MjEwMjQ3NjQ4Nn0.qfvWmHHk-SY06QXgb6cEtacV7ACeqPQ5jAEuQecMlJA';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    '⚠️ VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — using hardcoded fallback. ' +
    'Set these env vars in your hosting provider for production.'
  );
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

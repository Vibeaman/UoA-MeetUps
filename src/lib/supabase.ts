import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default project configuration provided by user
const SUPABASE_PROJECT_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://ylyfpatonnplpmvmrsji.supabase.co';

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlseWZwYXRvbm5wbHBtdm1yc2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5MDA0ODYsImV4cCI6MjEwMjQ3NjQ4Nn0.qfvWmHHk-SY06QXgb6cEtacV7ACeqPQ5jAEuQecMlJA';

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

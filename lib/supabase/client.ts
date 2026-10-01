// Aroma Deluz — Supabase Client (Browser)
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return null when Supabase is not configured — triggers demo mode
    return null;
  }

  return createBrowserClient(url, key);
}

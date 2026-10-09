// Aroma Deluz — Supabase Server Client
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Environment values pasted into a hosting dashboard often carry a leading
 * byte-order mark or trailing newline. supabase-js puts the key straight into an
 * HTTP header, and a U+FEFF there throws
 * "Cannot convert argument to a ByteString ... 65279", which takes down every
 * route that uses the service-role client.
 */
export function envValue(value: string | undefined): string | undefined {
  const cleaned = value?.replace(/^\uFEFF/, '').trim();
  return cleaned || undefined;
}

export async function createServerSupabaseClient() {
  const url = envValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = envValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !key) return null;

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}

let cachedServiceRoleClient: any = null;

export function createServiceRoleClient() {
  const url = envValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceKey = envValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!url || !serviceKey) return null;

  if (!cachedServiceRoleClient) {
    cachedServiceRoleClient = createSupabaseClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return cachedServiceRoleClient;
}

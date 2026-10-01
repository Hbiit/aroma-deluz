// Aroma Deluz — Supabase Auth Callback Route
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/account';

  if (code) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data } = await supabase.auth.exchangeCodeForSession(code);
      if (data?.user?.email) {
        const createdAt = new Date(data.user.created_at).getTime();
        const now = Date.now();
        // If user account was created within the last 3 minutes, send welcome email
        if (now - createdAt < 180000) {
          try {
            const { sendWelcomeEmail } = await import('@/lib/mailgun');
            await sendWelcomeEmail({
              email: data.user.email,
              fullName: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email.split('@')[0],
            });
          } catch (e) {
            console.error('Welcome email OAuth error:', e);
          }
        }
      }
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

// Aroma Deluz — Supabase Auth Callback Route
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/checkout';

  let authSessionData: any = null;

  if (code) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data } = await supabase.auth.exchangeCodeForSession(code);
      authSessionData = data;
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

  // If next is a mobile deep link (aromadeluz://...), forward session tokens directly
  if (next.startsWith('aromadeluz://')) {
    const deepLink = new URL(next);
    if (authSessionData?.session?.access_token) {
      deepLink.searchParams.set('access_token', authSessionData.session.access_token);
      deepLink.searchParams.set('refresh_token', authSessionData.session.refresh_token || '');
    }
    if (authSessionData?.user) {
      deepLink.searchParams.set('user_id', authSessionData.user.id);
      deepLink.searchParams.set('email', authSessionData.user.email || '');
      const name = authSessionData.user.user_metadata?.full_name || authSessionData.user.user_metadata?.name || authSessionData.user.email?.split('@')[0] || '';
      deepLink.searchParams.set('name', name);
    }
    return NextResponse.redirect(deepLink);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

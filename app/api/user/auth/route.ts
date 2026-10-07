// Aroma Deluz — Native In-App Authentication API Route
// POST /api/user/auth
// Enables fully native mobile authentication:
// - Sign Up with instant email confirmation (no confirmation email redirecting to localhost)
// - Sign In validation
// - Native Google Authentication session resolution without external browser redirects

import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, password, name, provider } = body;

    const supabaseAdmin = createServiceRoleClient();
    const supabaseClient = await createServerSupabaseClient();

    // 1. Native Mobile Sign Up
    if (action === 'signup') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();
      const displayName = name?.trim() || cleanEmail.split('@')[0];

      // Use Service Role to create pre-confirmed user (bypasses localhost confirmation redirect)
      if (supabaseAdmin) {
        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existing = existingUsers?.users?.find((u: any) => u.email?.toLowerCase() === cleanEmail);

        if (existing) {
          return NextResponse.json({ error: 'An account with this email already exists. Please sign in.' }, { status: 400 });
        }

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password,
          email_confirm: true, // AUTO-CONFIRM: Eliminates external email link redirect to localhost
          user_metadata: {
            full_name: displayName,
          },
        });

        if (createError) {
          return NextResponse.json({ error: createError.message }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          user: {
            id: newUser.user.id,
            email: newUser.user.email,
            name: displayName,
          },
        });
      }

      // Fallback via standard client
      if (supabaseClient) {
        const { data, error } = await supabaseClient.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: displayName },
            emailRedirectTo: 'https://aroma-deluz.vercel.app/auth/callback',
          },
        });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          user: {
            id: data.user?.id,
            email: data.user?.email,
            name: displayName,
          },
        });
      }

      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    // 2. Native Mobile Sign In
    if (action === 'signin') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();

      if (supabaseClient) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          // If error is email not confirmed and admin client available, auto-confirm it
          if (error.message.toLowerCase().includes('not confirmed') && supabaseAdmin) {
            const { data: users } = await supabaseAdmin.auth.admin.listUsers();
            const matched = users?.users?.find((u: any) => u.email?.toLowerCase() === cleanEmail);
            if (matched) {
              await supabaseAdmin.auth.admin.updateUserById(matched.id, { email_confirm: true });
              // Retry sign in
              const { data: retryData, error: retryError } = await supabaseClient.auth.signInWithPassword({
                email: cleanEmail,
                password,
              });
              if (!retryError && retryData?.user) {
                return NextResponse.json({
                  success: true,
                  user: {
                    id: retryData.user.id,
                    email: retryData.user.email,
                    name: retryData.user.user_metadata?.full_name || cleanEmail.split('@')[0],
                  },
                  session: retryData.session,
                });
              }
            }
          }

          return NextResponse.json({ error: error.message }, { status: 401 });
        }

        return NextResponse.json({
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
          },
          session: data.session,
        });
      }

      return NextResponse.json({ error: 'Database client unavailable' }, { status: 503 });
    }

    // 3. Native Google Sign-In In-App Resolution
    if (action === 'google') {
      const cleanEmail = (email || '').trim().toLowerCase();
      const displayName = name?.trim() || cleanEmail.split('@')[0] || 'Valued Client';

      if (!cleanEmail) {
        return NextResponse.json({ error: 'Google account email required' }, { status: 400 });
      }

      if (supabaseAdmin) {
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        let user = users?.users?.find((u: any) => u.email?.toLowerCase() === cleanEmail);

        if (!user) {
          // Create confirmed Google user
          const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            email_confirm: true,
            user_metadata: {
              full_name: displayName,
              provider: 'google',
            },
          });
          if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
          }
          user = created.user;
        }

        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || displayName,
          },
        });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: 'user_' + Date.now().toString(36),
          email: cleanEmail,
          name: displayName,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[User Auth API Error]:', error);
    return NextResponse.json({ error: error.message || 'Authentication failed' }, { status: 500 });
  }
}

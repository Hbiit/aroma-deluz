import { NextResponse } from 'next/server';
import { createServerSupabaseClient, envValue } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryEmail = searchParams.get('email');
    const queryUserId = searchParams.get('userId');

    // 1. Try to get authenticated user from session
    let sessionUser: { id: string; email?: string } | null = null;
    const client = await createServerSupabaseClient();
    if (client) {
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        sessionUser = { id: user.id, email: user.email };
      }
    }

    const targetUserId = sessionUser?.id || queryUserId;
    const targetEmail = sessionUser?.email || queryEmail;

    if (!targetUserId && !targetEmail) {
      return NextResponse.json({ orders: [] });
    }

    // 2. Query orders using Service Role key to bypass RLS constraints for customer view
    const supabaseUrl = envValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const serviceRoleKey = envValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ orders: [] });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    let query = adminClient
      .from('orders')
      .select(`
        id,
        reference,
        user_id,
        email,
        full_name,
        phone,
        address,
        city,
        state,
        status,
        total_kobo,
        created_at,
        order_items (
          id,
          name,
          unit_price_kobo,
          quantity
        )
      `)
      .order('created_at', { ascending: false });

    if (targetUserId && targetEmail) {
      query = query.or(`user_id.eq.${targetUserId},email.eq.${targetEmail}`);
    } else if (targetUserId) {
      query = query.eq('user_id', targetUserId);
    } else if (targetEmail) {
      query = query.eq('email', targetEmail);
    }

    const { data: orders, error } = await query.limit(50);

    if (error) {
      console.error('Error fetching user orders:', error.message);
      return NextResponse.json({ orders: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: orders || [] });
  } catch (err: any) {
    console.error('User orders API error:', err.message);
    return NextResponse.json({ orders: [], error: err.message }, { status: 500 });
  }
}

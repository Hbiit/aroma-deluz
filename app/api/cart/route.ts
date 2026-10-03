import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

// In-memory fallback if Supabase is temporarily unreachable
const fallbackCarts = new Map<string, any[]>();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.admin.getUserById(userId);
        if (!error && data?.user) {
          const cart = Array.isArray(data.user.user_metadata?.cart)
            ? data.user.user_metadata.cart
            : [];
          fallbackCarts.set(userId, cart);
          return NextResponse.json({ success: true, items: cart });
        }
      } catch (err) {
        console.warn('Error fetching user cart from Supabase admin:', err);
      }
    }

    // Fallback to local map if service client not configured or errored
    const items = fallbackCarts.get(userId) || [];
    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, items } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const cartItems = Array.isArray(items) ? items : [];
    fallbackCarts.set(userId, cartItems);

    const supabase = createServiceRoleClient();
    if (supabase) {
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        const existingMeta = userData?.user?.user_metadata || {};

        const { error } = await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...existingMeta,
            cart: cartItems,
            cart_updated_at: new Date().toISOString(),
          },
        });

        if (error) {
          console.warn('Failed to update cart in Supabase:', error.message);
        }
      } catch (err) {
        console.warn('Error updating cart in Supabase:', err);
      }
    }

    return NextResponse.json({
      success: true,
      items: cartItems,
      updated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to save cart' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    fallbackCarts.delete(userId);

    const supabase = createServiceRoleClient();
    if (supabase) {
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        const existingMeta = userData?.user?.user_metadata || {};

        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...existingMeta,
            cart: [],
            cart_updated_at: new Date().toISOString(),
          },
        });
      } catch (err) {
        console.warn('Error clearing cart in Supabase:', err);
      }
    }

    return NextResponse.json({ success: true, items: [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to clear cart' },
      { status: 500 }
    );
  }
}

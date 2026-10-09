import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_QTY = 99;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: corsHeaders });
}

function clampQty(raw: unknown, fallback = 1) {
  const n = typeof raw === 'number' && Number.isFinite(raw) ? Math.floor(raw) : fallback;
  return Math.min(MAX_QTY, Math.max(1, n));
}

/**
 * `cart_items.user_id` is a uuid column. Reject anything else up front so the
 * failure is a clear 400 instead of a Postgres cast error reported as a
 * retryable 500.
 */
function invalidUserId(userId: string) {
  return !UUID_RE.test(userId);
}

/**
 * Resolve a cart item reference to a real products.id (uuid).
 * Accepts a uuid id, a slug, or a non-uuid id that is actually a slug.
 */
async function resolveProductId(
  supabase: NonNullable<ReturnType<typeof createServiceRoleClient>>,
  item: { id?: string; slug?: string }
): Promise<string | null> {
  const id = typeof item?.id === 'string' ? item.id.trim() : '';
  const slug = typeof item?.slug === 'string' ? item.slug.trim() : '';

  if (id && UUID_RE.test(id)) {
    const { data } = await supabase.from('products').select('id').eq('id', id).maybeSingle();
    if (data?.id) return data.id as string;
  }

  const candidate = slug || (id && !UUID_RE.test(id) ? id : '');
  if (candidate) {
    const { data } = await supabase.from('products').select('id').eq('slug', candidate).maybeSingle();
    if (data?.id) return data.id as string;
  }

  return null;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    const userId = new URL(req.url).searchParams.get('userId');
    if (!userId) return json({ error: 'userId is required' }, 400);
    if (invalidUserId(userId)) return json({ error: 'userId must be a valid uuid', code: 'INVALID_USER_ID' }, 400);

    const supabase = createServiceRoleClient();
    if (!supabase) return json({ error: 'Supabase client not initialized' }, 500);

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        qty,
        updated_at,
        products (
          id,
          slug,
          name,
          price_kobo,
          image_url,
          stock
        )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: true });

    if (error) {
      console.warn('Error fetching cart_items:', error.message);
      return json({ error: error.message }, 500);
    }

    const items = (data || [])
      .map((row: any) => ({
        id: row.products?.id,
        slug: row.products?.slug,
        name: row.products?.name,
        price_kobo: row.products?.price_kobo,
        image_url: row.products?.image_url,
        stock: row.products?.stock,
        qty: row.qty,
      }))
      .filter((item: any) => item.id);

    return json({ success: true, items });
  } catch (error: any) {
    return json({ error: error?.message || 'Failed to fetch cart', items: [] }, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, action, item, items } = body || {};
    if (!userId) return json({ error: 'userId is required' }, 400);
    if (invalidUserId(userId)) return json({ error: 'userId must be a valid uuid', code: 'INVALID_USER_ID' }, 400);

    const supabase = createServiceRoleClient();
    if (!supabase) return json({ error: 'Supabase client not initialized' }, 500);

    const now = new Date().toISOString();

    if (action === 'add' || action === 'update' || action === 'set') {
      if (!item || (!item.id && !item.slug)) {
        return json({ error: 'Item id or slug is required' }, 400);
      }
      const productId = await resolveProductId(supabase, item);
      if (!productId) return json({ error: 'Product not found', code: 'PRODUCT_NOT_FOUND' }, 404);

      let qty = clampQty(item.qty);
      if (action === 'add') {
        const { data: existing } = await supabase
          .from('cart_items')
          .select('qty')
          .eq('user_id', userId)
          .eq('product_id', productId)
          .maybeSingle();
        qty = clampQty((existing?.qty || 0) + qty);
      }

      const { error } = await supabase
        .from('cart_items')
        .upsert(
          { user_id: userId, product_id: productId, qty, updated_at: now },
          { onConflict: 'user_id, product_id' }
        );
      if (error) return json({ error: error.message }, 500);

      return json({ success: true, productId, qty, updated_at: now });
    }

    if (action === 'remove') {
      if (!item || (!item.id && !item.slug)) {
        return json({ error: 'Item id or slug is required' }, 400);
      }
      const productId = await resolveProductId(supabase, item);
      // Nothing to remove if the product does not exist — treat as success (idempotent).
      if (!productId) return json({ success: true, updated_at: now });

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);
      if (error) return json({ error: error.message }, 500);

      return json({ success: true, updated_at: now });
    }

    if (action === 'sync' || action === 'merge') {
      // Idempotent union: keep the larger quantity per product.
      // Clients push their whole (already merged) cart here on load, so adding
      // quantities would inflate the cart on every page load.
      const rawItems = Array.isArray(items) ? items : [];
      const rejected: string[] = [];
      for (const i of rawItems) {
        const productId = await resolveProductId(supabase, i);
        if (!productId) {
          rejected.push(String(i?.id || i?.slug || ''));
          continue;
        }
        const { data: existing } = await supabase
          .from('cart_items')
          .select('qty')
          .eq('user_id', userId)
          .eq('product_id', productId)
          .maybeSingle();
        const qty = clampQty(Math.max(existing?.qty || 0, clampQty(i?.qty)));
        const { error } = await supabase
          .from('cart_items')
          .upsert(
            { user_id: userId, product_id: productId, qty, updated_at: now },
            { onConflict: 'user_id, product_id' }
          );
        if (error) return json({ error: error.message }, 500);
      }
      return json({ success: true, rejected, updated_at: now });
    }

    // Backwards compatibility: wholesale replace when items are sent without an action
    const rawItems = Array.isArray(items) ? items : Array.isArray(body) ? body : null;
    if (!rawItems) return json({ error: 'Invalid action or payload' }, 400);

    const { error: delError } = await supabase.from('cart_items').delete().eq('user_id', userId);
    if (delError) return json({ error: delError.message }, 500);

    const inserts: any[] = [];
    for (const i of rawItems) {
      const productId = await resolveProductId(supabase, i);
      if (productId) {
        inserts.push({ user_id: userId, product_id: productId, qty: clampQty(i?.qty), updated_at: now });
      }
    }
    if (inserts.length > 0) {
      const { error } = await supabase.from('cart_items').insert(inserts);
      if (error) return json({ error: error.message }, 500);
    }
    return json({ success: true, updated_at: now });
  } catch (error: any) {
    console.error('Cart POST error:', error);
    return json({ error: error?.message || 'Failed to modify cart' }, 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = new URL(req.url).searchParams.get('userId');
    if (!userId) return json({ error: 'userId is required' }, 400);
    if (invalidUserId(userId)) return json({ error: 'userId must be a valid uuid', code: 'INVALID_USER_ID' }, 400);

    const supabase = createServiceRoleClient();
    if (!supabase) return json({ error: 'Supabase client not initialized' }, 500);

    const { error } = await supabase.from('cart_items').delete().eq('user_id', userId);
    if (error) return json({ error: error.message }, 500);

    return json({ success: true, items: [] });
  } catch (error: any) {
    return json({ error: error?.message || 'Failed to clear cart' }, 500);
  }
}

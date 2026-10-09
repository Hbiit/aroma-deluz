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

/**
 * Deletion tombstones.
 *
 * A whole-cart push (`sync`/`merge`, or the legacy "replace" payload) is a
 * snapshot of what one device *believes* the cart to be. Applying it blindly
 * re-inserts rows that another device deleted, which is how a removal made in
 * the mobile app used to come back.
 *
 * So every removal is recorded here, keyed by product id. Snapshot-style
 * writers skip products removed within TOMBSTONE_WINDOW_MS, while the explicit
 * per-item writes (`add`/`update`/`set`) clear the tombstone immediately — a
 * deliberate re-add is never blocked, an accidental one cannot happen.
 *
 * Stored in the auth user's metadata so no schema migration is needed; the key
 * is merged rather than replaced, so the legacy `cart` key written by older
 * builds survives.
 */
const TOMBSTONE_KEY = 'cart_tombstones';
const TOMBSTONE_WINDOW_MS = 24 * 60 * 60 * 1000;

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

type ServiceClient = NonNullable<ReturnType<typeof createServiceRoleClient>>;
type TombstoneMap = Record<string, string>;

/** Read the user's deletion tombstones plus the rest of their metadata. */
async function readCartState(
  supabase: ServiceClient,
  userId: string
): Promise<{ tombstones: TombstoneMap; metadata: Record<string, unknown> }> {
  try {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error || !data?.user) return { tombstones: {}, metadata: {} };
    const metadata = (data.user.user_metadata || {}) as Record<string, unknown>;
    const raw = metadata[TOMBSTONE_KEY];
    const tombstones: TombstoneMap =
      raw && typeof raw === 'object' && !Array.isArray(raw)
        ? (Object.fromEntries(
            Object.entries(raw as Record<string, unknown>).filter(
              ([productId, at]) => UUID_RE.test(productId) && typeof at === 'string'
            )
          ) as TombstoneMap)
        : {};
    return { tombstones, metadata };
  } catch (error: any) {
    console.warn('Could not read cart tombstones:', error?.message || error);
    return { tombstones: {}, metadata: {} };
  }
}

/** Products whose removal is recent enough that snapshots must not undo it. */
function activeTombstones(tombstones: TombstoneMap, now: number): Set<string> {
  const active = new Set<string>();
  for (const [productId, at] of Object.entries(tombstones)) {
    const parsed = Date.parse(at);
    if (Number.isFinite(parsed) && now - parsed < TOMBSTONE_WINDOW_MS) active.add(productId);
  }
  return active;
}

/**
 * Persist tombstones, pruning entries that fell outside the protection window
 * so the metadata blob cannot grow forever.
 */
async function writeTombstones(
  supabase: ServiceClient,
  userId: string,
  tombstones: TombstoneMap,
  metadata: Record<string, unknown>,
  now = Date.now()
) {
  const kept: TombstoneMap = {};
  for (const [productId, at] of Object.entries(tombstones)) {
    const parsed = Date.parse(at);
    if (Number.isFinite(parsed) && now - parsed < TOMBSTONE_WINDOW_MS) kept[productId] = at;
  }
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { ...metadata, [TOMBSTONE_KEY]: kept },
  });
  if (error) console.warn('Could not persist cart tombstones:', error.message);
}

/** Record that these products were just removed. */
async function tombstoneProducts(
  supabase: ServiceClient,
  userId: string,
  productIds: string[],
  now: number
) {
  const ids = productIds.filter((id) => UUID_RE.test(id));
  if (ids.length === 0) return;
  const { tombstones, metadata } = await readCartState(supabase, userId);
  const at = new Date(now).toISOString();
  for (const id of ids) tombstones[id] = at;
  await writeTombstones(supabase, userId, tombstones, metadata, now);
}

/** A deliberate per-item write revives the product, so drop its tombstone. */
async function reviveProduct(supabase: ServiceClient, userId: string, productId: string) {
  if (!UUID_RE.test(productId)) return;
  const { tombstones, metadata } = await readCartState(supabase, userId);
  if (!tombstones[productId]) return;
  delete tombstones[productId];
  await writeTombstones(supabase, userId, tombstones, metadata);
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

      // Explicit per-item write: the user (or their app) means it, so a
      // previous removal of this product must not block it.
      await reviveProduct(supabase, userId, productId);

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

      // Remember the removal: a stale snapshot pushed by another device (or an
      // older build) must not bring this line back.
      await tombstoneProducts(supabase, userId, [productId], Date.parse(now));

      return json({ success: true, updated_at: now });
    }

    if (action === 'sync' || action === 'merge') {
      // Idempotent union: keep the larger quantity per product.
      // Clients push their whole (already merged) cart here on load, so adding
      // quantities would inflate the cart on every page load.
      //
      // Snapshot semantics: products removed elsewhere stay removed. This is
      // reported back in `skipped` rather than silently dropped.
      const rawItems = Array.isArray(items) ? items : [];
      const rejected: string[] = [];
      const skipped: string[] = [];
      const blocked = activeTombstones((await readCartState(supabase, userId)).tombstones, Date.parse(now));
      for (const i of rawItems) {
        const productId = await resolveProductId(supabase, i);
        if (!productId) {
          rejected.push(String(i?.id || i?.slug || ''));
          continue;
        }
        if (blocked.has(productId)) {
          skipped.push(productId);
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
      return json({ success: true, rejected, skipped, updated_at: now });
    }

    // Backwards compatibility: wholesale replace when items are sent without an action
    const rawItems = Array.isArray(items) ? items : Array.isArray(body) ? body : null;
    if (!rawItems) return json({ error: 'Invalid action or payload' }, 400);

    // A wholesale replace is still a snapshot of one device's view: it may
    // empty the cart, but it must not re-add lines removed on another device.
    const skipped: string[] = [];
    const blocked = activeTombstones((await readCartState(supabase, userId)).tombstones, Date.parse(now));

    const { error: delError } = await supabase.from('cart_items').delete().eq('user_id', userId);
    if (delError) return json({ error: delError.message }, 500);

    const inserts: any[] = [];
    for (const i of rawItems) {
      const productId = await resolveProductId(supabase, i);
      if (!productId) continue;
      if (blocked.has(productId)) {
        skipped.push(productId);
        continue;
      }
      inserts.push({ user_id: userId, product_id: productId, qty: clampQty(i?.qty), updated_at: now });
    }
    if (inserts.length > 0) {
      const { error } = await supabase.from('cart_items').insert(inserts);
      if (error) return json({ error: error.message }, 500);
    }
    return json({ success: true, skipped, updated_at: now });
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

    // Tombstone what is being cleared first, so a device that still has the
    // old cart in memory cannot silently restore it.
    const { data: rows } = await supabase.from('cart_items').select('product_id').eq('user_id', userId);
    const cleared = (rows || []).map((row: any) => String(row.product_id)).filter((id: string) => UUID_RE.test(id));
    if (cleared.length > 0) await tombstoneProducts(supabase, userId, cleared, Date.now());

    const { error } = await supabase.from('cart_items').delete().eq('user_id', userId);
    if (error) return json({ error: error.message }, 500);

    return json({ success: true, items: [], cleared: cleared.length });
  } catch (error: any) {
    return json({ error: error?.message || 'Failed to clear cart' }, 500);
  }
}

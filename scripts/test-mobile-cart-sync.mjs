// Aroma Deluz — Website ⇄ Mobile App cart synchronization test.
//
// Exercises the real /api/cart contract against a running storefront:
//   node --env-file=.env.local scripts/test-mobile-cart-sync.mjs
//   API_BASE=... SYNC_TEST_USER_ID=<existing account uuid> node scripts/test-mobile-cart-sync.mjs
//
// `cart_items.user_id` is a uuid with a foreign key to auth.users, so the test
// needs a real account. Without SYNC_TEST_USER_ID it creates a throwaway
// confirmed account with the service-role key and deletes it afterwards.
// Every cart row it writes is deleted at the end.

import { createClient } from '@supabase/supabase-js';

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

let passed = 0;
const failures = [];

/** The account whose cart this run drives (set in run()). */
let OWNER = '';

/** JSON with object keys sorted, so `{a,b}` and `{b,a}` compare equal. */
function stable(value) {
  return JSON.stringify(value, (_key, val) =>
    val && typeof val === 'object' && !Array.isArray(val)
      ? Object.fromEntries(Object.entries(val).sort(([x], [y]) => x.localeCompare(y)))
      : val
  );
}

function check(label, actual, expected) {
  const a = stable(actual);
  const e = stable(expected);
  if (a === e) {
    passed += 1;
    console.log(`  \u2713 ${label}`);
  } else {
    failures.push(`${label}\n      expected: ${e}\n      actual:   ${a}`);
    console.log(`  \u2717 ${label}\n      expected: ${e}\n      actual:   ${a}`);
  }
}

async function post(payload) {
  const res = await fetch(`${API_BASE}/api/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  let body = null;
  try {
    body = await res.json();
  } catch {}
  return { status: res.status, body };
}

async function readCart() {
  const res = await fetch(`${API_BASE}/api/cart?userId=${encodeURIComponent(OWNER)}`, {
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, items: Array.isArray(body.items) ? body.items : [] };
}

async function clearCart() {
  await fetch(`${API_BASE}/api/cart?userId=${encodeURIComponent(OWNER)}`, { method: 'DELETE' });
}

/** Readable view of the cart for assertions: { [slug]: qty } */
function qtyBySlug(items) {
  return Object.fromEntries(items.map((i) => [i.slug, i.qty]).sort(([a], [b]) => a.localeCompare(b)));
}

/**
 * Resolve the account whose cart is used for the run.
 * Returns the cart owner id plus a cleanup that removes the throwaway account.
 */
async function resolveOwner() {
  const provided = process.env.SYNC_TEST_USER_ID;
  if (provided) return { owner: provided, cleanup: async () => {} };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      'No cart owner available. Set SYNC_TEST_USER_ID, or run with ' +
        '`node --env-file=.env.local` so a throwaway account can be created.'
    );
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const email = `cart.sync.probe.${Date.now()}@aroma-deluz.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: `Probe-${Date.now()}-aA!`,
    email_confirm: true,
    user_metadata: { full_name: 'Cart Sync Probe' },
  });
  if (error || !data?.user) {
    throw new Error(`Could not create a throwaway account: ${error?.message || 'unknown error'}`);
  }

  const id = data.user.id;
  return {
    owner: id,
    cleanup: async () => {
      await admin.auth.admin.deleteUser(id).catch(() => {});
    },
  };
}

async function run() {
  console.log('----------------------------------------------------------------');
  console.log('AROMA DE LUZ: WEBSITE <-> MOBILE CART SYNC TEST');
  console.log(`API: ${API_BASE}`);

  const { owner, cleanup } = await resolveOwner();
  OWNER = owner;
  const usesThrowawayAccount = !process.env.SYNC_TEST_USER_ID;
  console.log(`Cart owner: ${owner}${usesThrowawayAccount ? ' (throwaway account)' : ''}`);
  console.log('----------------------------------------------------------------\n');

  try {
    await runChecks();
  } finally {
    await clearCart();
    await cleanup();
  }
}

async function runChecks() {

  const productsRes = await fetch(`${API_BASE}/api/products`);
  const products = await productsRes.json();
  if (!Array.isArray(products) || products.length < 2) {
    throw new Error(`Could not load a catalog from ${API_BASE}/api/products (got ${productsRes.status})`);
  }
  const [p1, p2] = products;
  console.log(`Catalog: "${p1.name}" / "${p2.name}"\n`);

  await clearCart();

  // 1. Website adds a line item (incremental `add`).
  console.log('[1] Website: add 1 x ' + p1.name);
  const added = await post({ userId: OWNER, action: 'add', item: { id: p1.id, qty: 1 } });
  check('POST add -> 200', added.status, 200);
  check('server quantity is 1', (await readCart()).items.find((i) => i.id === p1.id)?.qty, 1);

  // 2. The website re-pushes its whole cart on every mount. That push must be
  //    idempotent — before the fix it doubled the quantity on every reload.
  console.log('\n[2] Website: reload 4x (each reload re-pushes the whole cart)');
  for (let i = 0; i < 4; i += 1) {
    await post({ userId: OWNER, action: 'sync', items: [{ id: p1.id, qty: 1 }] });
  }
  check('quantity did NOT inflate after 4 reloads', (await readCart()).items.find((i) => i.id === p1.id)?.qty, 1);

  // 3. Mobile sets an absolute quantity.
  console.log('\n[3] Mobile: set ' + p1.name + ' quantity to 3');
  await post({ userId: OWNER, action: 'update', item: { id: p1.id, slug: p1.slug, qty: 3 } });
  check('website sees quantity 3', (await readCart()).items.find((i) => i.id === p1.id)?.qty, 3);

  // 4. Mobile adds a catalog-fallback item: a non-uuid id that must resolve by slug.
  console.log('\n[4] Mobile: add ' + p2.name + ' using a non-uuid catalog id (resolved by slug)');
  const slugPush = await post({
    userId: OWNER,
    action: 'update',
    item: { id: 'c-vla', slug: p2.slug, qty: 2 },
  });
  check('POST update by slug -> 200', slugPush.status, 200);
  const afterSlug = await readCart();
  check(
    'item stored under its real product id',
    afterSlug.items.find((i) => i.slug === p2.slug)?.id,
    p2.id
  );
  check('both lines present for the website', qtyBySlug(afterSlug.items), { [p1.slug]: 3, [p2.slug]: 2 });

  // 5. Mobile removes a line.
  console.log('\n[5] Mobile: remove ' + p1.name);
  await post({ userId: OWNER, action: 'remove', item: { id: p1.id, slug: p1.slug } });
  check('website sees only the remaining line', qtyBySlug((await readCart()).items), { [p2.slug]: 2 });

  // 6. Legacy client (previous APK / older storefront) sends the whole cart with no action.
  console.log('\n[6] Legacy client: wholesale replace with 5 x ' + p2.name);
  const legacy = await post({ userId: OWNER, items: [{ id: p2.id, slug: p2.slug, qty: 5 }] });
  check('POST legacy payload -> 200', legacy.status, 200);
  check('cart replaced', qtyBySlug((await readCart()).items), { [p2.slug]: 5 });

  // 7. Merge keeps the larger quantity (never adds, never lowers).
  console.log('\n[7] Merge semantics: push 7 then push 2');
  await post({ userId: OWNER, action: 'merge', items: [{ id: p2.id, qty: 7 }] });
  await post({ userId: OWNER, action: 'merge', items: [{ id: p2.id, qty: 2 }] });
  check('larger quantity wins', (await readCart()).items.find((i) => i.id === p2.id)?.qty, 7);

  // 8. Unknown products are reported, not silently stored.
  console.log('\n[8] Unknown product is rejected in the sync report');
  const rejected = await post({
    userId: OWNER,
    action: 'sync',
    items: [{ id: 'does-not-exist', slug: 'no-such-product', qty: 1 }],
  });
  check('rejected list names the unknown product', rejected.body?.rejected, ['does-not-exist']);

  // 9. Clearing the cart empties both sides.
  console.log('\n[9] Clear cart');
  await clearCart();
  check('cart is empty', (await readCart()).items.length, 0);

  // 10. A synthetic account id (storefront demo mode) fails fast and clearly
  //     instead of surfacing a Postgres cast error as a retryable 500.
  console.log('\n[10] Non-uuid account id is rejected with a clear 400');
  const badId = await post({ userId: 'demo-user-123', action: 'add', item: { id: p2.id, qty: 1 } });
  check('POST -> 400', badId.status, 400);
  check('error code names the problem', badId.body?.code, 'INVALID_USER_ID');

  await clearCart();

  console.log('\n----------------------------------------------------------------');
  if (failures.length === 0) {
    console.log(`ALL ${passed} CHECKS PASSED: website <-> mobile cart sync verified`);
    console.log('----------------------------------------------------------------');
    return;
  }
  console.log(`${passed} passed, ${failures.length} FAILED:`);
  for (const f of failures) console.log(`  - ${f}`);
  console.log('----------------------------------------------------------------');
  process.exitCode = 1;
}

run().catch(async (err) => {
  console.error('\nTEST ERROR:', err?.message || err);
  await clearCart().catch(() => {});
  process.exitCode = 1;
});

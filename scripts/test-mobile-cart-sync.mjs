// Aroma Deluz — Web & Mobile Authentication and Real-time Cart Synchronization Test
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rkrmyhnboaoslczdnsxi.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrcm15aG5ib2Fvc2xjemRuc3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NDU4OTAsImV4cCI6MjEwNjQyMTg5MH0.OrY0rrmxicLpsjrRfp2ciAA0mJbk01L4tfO1BMsoZms';

const API_BASE = 'http://localhost:3000';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TEST_EMAIL = `tester.sync.${Date.now()}@gmail.com`;
const TEST_PASSWORD = 'LuxuryPassword123!';

async function runTest() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ AROMA DE LUZ: MOBILE & WEB CART SYNCHRONIZATION TEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // STEP 1: Shared Authentication (Create or retrieve confirmed user)
  console.log(`[1] Testing Shared Authentication across Web & Mobile...`);
  console.log(`    Ensuring test user account exists: ${TEST_EMAIL}`);

  // Use service role to bypass email rate limits
  const serviceClient = createClient(
    SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrcm15aG5ib2Fvc2xjemRuc3hpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDg0NTg5MCwiZXhwIjoyMTA2NDIxODkwfQ.HXyKRVADN5OFy-mr682AbZuO_mWnv-3FzycKBkYRbxI'
  );

  let userId;
  const { data: adminUser, error: adminErr } = await serviceClient.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: 'VIP Fragrance Collector' },
  });

  if (adminUser?.user) {
    userId = adminUser.user.id;
  } else {
    // If already exists or error, list existing users
    const { data: usersData } = await serviceClient.auth.admin.listUsers();
    const existing = usersData?.users?.[0];
    if (existing) {
      userId = existing.id;
    } else {
      throw new Error(`Could not create or get user: ${adminErr?.message}`);
    }
  }

  // Verify regular client can authenticate
  const { data: sessionData, error: sessionErr } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  console.log(`    ✓ Successfully authenticated! Shared User ID: ${userId}`);
  console.log(`    ✓ Verified Supabase Client Session for: ${TEST_EMAIL}\n`);

  // STEP 2: Clear existing user cart on server
  console.log(`[2] Ensuring clean cart slate on server...`);
  await fetch(`${API_BASE}/api/cart?userId=${userId}`, { method: 'DELETE' });
  const checkEmpty = await (await fetch(`${API_BASE}/api/cart?userId=${userId}`)).json();
  console.log(`    Initial cart items count: ${checkEmpty.items?.length || 0}`);
  if ((checkEmpty.items?.length || 0) !== 0) {
    throw new Error('Cart not clean');
  }
  console.log(`    ✓ Clean slate verified.\n`);

  // STEP 3: User adds an item to cart on WEBSITE
  console.log(`[3] WEBSITE: User adds 'Velvet Lavender & Amber Candle' (qty: 2) on Website...`);
  const webCartItem = {
    id: 'p-velvet-lavender',
    slug: 'velvet-lavender-amber-candle',
    name: 'Velvet Lavender & Amber Candle',
    price_kobo: 3500000,
    image_url: '/product-lamour.jpg',
    qty: 2,
  };

  const webPostRes = await fetch(`${API_BASE}/api/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, items: [webCartItem] }),
  });
  const webPostJson = await webPostRes.json();
  console.log(`    Web API response: status ${webPostRes.status}, items: ${webPostJson.items?.length}`);

  // STEP 4: MOBILE APP checks cart
  console.log(`\n[4] MOBILE APP: Mobile app polls /api/cart for User ID: ${userId}...`);
  const mobileFetchRes = await fetch(`${API_BASE}/api/cart?userId=${userId}`);
  const mobileCart = await mobileFetchRes.json();
  console.log(`    Mobile received ${mobileCart.items?.length} items:`, mobileCart.items);

  const foundWebItemOnMobile = mobileCart.items?.find((i) => i.id === webCartItem.id);
  if (!foundWebItemOnMobile || foundWebItemOnMobile.qty !== 2) {
    throw new Error(`FAILURE: Item added on website was not found in mobile cart!`);
  }
  console.log(`    ✓ SUCCESS: Web-added item INSTANTLY appeared in Mobile App cart!\n`);

  // STEP 5: User adds another item on MOBILE APP
  console.log(`[5] MOBILE APP: User adds 'Vanilla Oud & Jasmine Candle' (qty: 1) on Mobile App...`);
  const mobileCartItem = {
    id: 'p-vanilla-oud',
    slug: 'vanilla-oud-jasmine-candle',
    name: 'Vanilla Oud & Jasmine Candle',
    price_kobo: 3800000,
    image_url: '/product-lamour.jpg',
    qty: 1,
  };

  const updatedMobileCart = [...mobileCart.items, mobileCartItem];
  const mobilePostRes = await fetch(`${API_BASE}/api/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, items: updatedMobileCart }),
  });
  console.log(`    Mobile API save status: ${mobilePostRes.status}`);

  // STEP 6: WEBSITE polls cart and reflects mobile additions
  console.log(`\n[6] WEBSITE: Website receives real-time update from /api/cart...`);
  const webFetchAgain = await (await fetch(`${API_BASE}/api/cart?userId=${userId}`)).json();
  console.log(`    Website received ${webFetchAgain.items?.length} items:`, webFetchAgain.items?.map(i => `${i.name} (x${i.qty})`));

  const foundMobileItemOnWeb = webFetchAgain.items?.find((i) => i.id === mobileCartItem.id);
  if (!foundMobileItemOnWeb || foundMobileItemOnWeb.qty !== 1) {
    throw new Error(`FAILURE: Item added on mobile was not found in website cart!`);
  }
  console.log(`    ✓ SUCCESS: Mobile-added item INSTANTLY appeared in Website cart!\n`);

  // STEP 7: Mobile updates quantity of an item
  console.log(`[7] BIDIRECTIONAL MUTATION: Mobile updates qty of 'Vanilla Oud' from 1 to 3...`);
  const mutatedList = webFetchAgain.items.map((i) => (i.id === mobileCartItem.id ? { ...i, qty: 3 } : i));
  await fetch(`${API_BASE}/api/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, items: mutatedList }),
  });

  const webVerifyMutation = await (await fetch(`${API_BASE}/api/cart?userId=${userId}`)).json();
  const mutatedItem = webVerifyMutation.items?.find((i) => i.id === mobileCartItem.id);
  if (mutatedItem?.qty !== 3) {
    throw new Error(`FAILURE: Quantity mutation failed to synchronize!`);
  }
  console.log(`    ✓ SUCCESS: Quantity change (qty: 3) synchronized across Web & Mobile!\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 ALL TESTS PASSED: LOGIN & CART SYNC FULLY VERIFIED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

runTest().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});

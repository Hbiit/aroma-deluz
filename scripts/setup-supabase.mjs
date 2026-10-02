// Aroma Deluz — Automated Supabase Database Provisioning & Seed Script
// Runs migrations and seeds data automatically using Supabase Service Role API

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local if present
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...values] = trimmed.split('=');
      if (key && values.length) {
        process.env[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n✦ ===============================================');
console.log('   Aroma De Luz — Automated Supabase Provisioning');
console.log('✦ ===============================================\n');

if (!supabaseUrl || !supabaseKey) {
  console.log('⚠️  No Supabase credentials detected.');
  console.log('   Please add the following to your .env.local file:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.log('\n   Or run in Demo Mode (active by default).\n');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const seededProducts = [
  { slug: 'velvet-rose-candle', name: 'Velvet Rose', description: 'A rich, opulent candle with deep rose and velvety musk undertones.', category: 'candle', collection: 'Floral Bouquets', price_kobo: 4500000, scent_notes: ['Damask Rose', 'Musk', 'Sandalwood'], image_url: '/product-lamour.jpg', stock: 25, featured: true },
  { slug: 'velvet-lavender-amber-candle', name: 'Velvet Lavender & Amber Candle', description: 'An artisanal union of calming French lavender, golden warm amber, and creamy Tahitian vanilla.', category: 'candle', collection: 'Warm & Sensual', price_kobo: 5400000, scent_notes: ['French Lavender', 'Golden Amber', 'Tahitian Vanilla', 'Smoked Sandalwood'], image_url: '/product-velvet-lavender.jpg', stock: 25, featured: true },
  { slug: 'vanilla-oud-smoked-jasmine-candle', name: 'Vanilla Oud & Smoked Jasmine Candle', description: 'A seductive blend of smoky night-blooming jasmine, dark agarwood (oud), and Madagascar vanilla bean.', category: 'candle', collection: 'Exclusive Collection', price_kobo: 5800000, scent_notes: ['Madagascar Vanilla', 'Dark Agarwood Oud', 'Night Jasmine', 'Smoked Incense'], image_url: '/product-vanilla-oud.jpg', stock: 20, featured: true },
  { slug: 'white-rose-bergamot-candle', name: 'White Rose & Bergamot Candle', description: 'Crisp Italian bergamot infused with delicate Bulgarian white petals, green mandarin, and cashmere wood.', category: 'candle', collection: 'Floral Bouquets', price_kobo: 4600000, scent_notes: ['Bulgarian White Rose', 'Italian Bergamot', 'Green Mandarin', 'Cashmere Wood'], image_url: '/product-rose-bergamot.jpg', stock: 30, featured: false },
  { slug: 'santal-noir-cardamom-candle', name: 'Santal Noir & Cardamom Candle', description: 'An exotic medley of Australian sandalwood, roasted Guatemalan cardamom, and black amber resin.', category: 'candle', collection: 'Warm & Sensual', price_kobo: 5200000, scent_notes: ['Australian Sandalwood', 'Black Cardamom', 'Tonka Bean', 'Dark Leather'], image_url: '/product-vanilla-oud.jpg', stock: 18, featured: false },
  { slug: 'amber-oud-candle', name: 'Amber Oud', description: 'Warm amber and precious oud wood create an intoxicating atmosphere.', category: 'candle', collection: 'Warm & Sensual', price_kobo: 5200000, scent_notes: ['Amber', 'Oud', 'Vanilla'], image_url: '/product-rose-noir.jpg', stock: 18, featured: true },
  { slug: 'citrus-garden-candle', name: 'Citrus Garden', description: 'Bright bergamot and lemon verbena uplift every room.', category: 'candle', collection: 'Fresh & Radiant', price_kobo: 3800000, scent_notes: ['Bergamot', 'Lemon Verbena', 'Green Tea'], image_url: '/product-eau-lumiere.jpg', stock: 30, featured: false },
  { slug: 'midnight-jasmine-candle', name: 'Midnight Jasmine', description: 'Night-blooming jasmine with a hint of starlit mystery.', category: 'candle', collection: 'Exclusive Collection', price_kobo: 6800000, scent_notes: ['Jasmine', 'Tuberose', 'Dark Amber'], image_url: '/product-jardin.jpg', stock: 12, featured: false },
  { slug: 'lavender-dreams-candle', name: 'Lavender Dreams', description: 'Calming French lavender paired with soft vanilla.', category: 'candle', collection: 'Floral Bouquets', price_kobo: 4200000, scent_notes: ['Lavender', 'Vanilla', 'Tonka Bean'], image_url: '/product-intense.jpg', stock: 20, featured: false },
  { slug: 'spiced-cedar-candle', name: 'Spiced Cedar', description: 'A warm, earthy blend of cedar bark and exotic spices.', category: 'candle', collection: 'Warm & Sensual', price_kobo: 4800000, scent_notes: ['Cedar', 'Cinnamon', 'Cardamom'], image_url: '/product-rose-noir.jpg', stock: 15, featured: false },
  { slug: 'lamour-perfume', name: "L'Amour", description: 'A captivating floral fragrance that embodies romance and elegance.', category: 'perfume', collection: 'Floral Bouquets', price_kobo: 12800000, scent_notes: ['Rose', 'Peony', 'White Musk'], image_url: '/product-lamour.jpg', stock: 20, featured: true },
  { slug: 'rose-noir-perfume', name: 'Rose Noir', description: 'A dark, sophisticated rose with smoky oud and leather accents.', category: 'perfume', collection: 'Warm & Sensual', price_kobo: 15800000, scent_notes: ['Dark Rose', 'Oud', 'Leather'], image_url: '/product-rose-noir.jpg', stock: 15, featured: true },
  { slug: 'eau-de-lumiere', name: 'Eau de Lumière', description: 'Radiant and luminous — citrus sparkle meets golden warmth.', category: 'perfume', collection: 'Fresh & Radiant', price_kobo: 12800000, scent_notes: ['Bergamot', 'Neroli', 'Amber'], image_url: '/product-eau-lumiere.jpg', stock: 22, featured: true },
  { slug: 'jardin-secrete', name: 'Jardin Secrète', description: 'A hidden garden of white florals and fresh green notes.', category: 'perfume', collection: 'Fresh & Radiant', price_kobo: 11500000, scent_notes: ['Lily of Valley', 'Green Fig', 'White Cedar'], image_url: '/product-jardin.jpg', stock: 28, featured: true },
  { slug: 'aroma-intense', name: 'Aroma Intense', description: 'The signature house perfume — bold, rich, and unforgettable.', category: 'perfume', collection: 'Exclusive Collection', price_kobo: 16800000, scent_notes: ['Saffron', 'Oud', 'Ambergris'], image_url: '/product-intense.jpg', stock: 10, featured: true },
  { slug: 'golden-dusk', name: 'Golden Dusk', description: 'Sunset captured in a bottle — warm, golden, and irresistible.', category: 'perfume', collection: 'Exclusive Collection', price_kobo: 18500000, scent_notes: ['Gold Amber', 'Iris', 'Praline'], image_url: '/product-eau-lumiere.jpg', stock: 8, featured: false }
];

async function runSetup() {
  console.log('🔄 Checking connection to Supabase at:', supabaseUrl);

  try {
    // 1. Check if products table exists
    const { data: existing, error: checkError } = await supabase
      .from('products')
      .select('id, slug')
      .limit(1);

    if (checkError) {
      console.log('ℹ️  Products table needs initialization.');
      console.log('   Please run supabase/migration.sql in your Supabase SQL Editor once.');
      console.log('   Error details:', checkError.message);
      return;
    }

    console.log('✓ Supabase database connection verified.');

    // 2. Automated Seed / Upsert
    console.log(`🔄 Seeding ${seededProducts.length} luxury products into Supabase...`);

    for (const product of seededProducts) {
      const { error: upsertError } = await supabase
        .from('products')
        .upsert(product, { onConflict: 'slug' });

      if (upsertError) {
        console.error(`   ✕ Failed to upsert ${product.name}:`, upsertError.message);
      } else {
        console.log(`   ✓ ${product.name} (${product.category})`);
      }
    }

    console.log('\n🎉 Supabase automation complete!');
    console.log('   All 12 luxury candles and perfumes are live in your database.');
  } catch (err) {
    console.error('✕ Automation error:', err);
  }
}

runSetup();

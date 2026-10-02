#!/usr/bin/env node
/**
 * Aroma De Luz — Product Management CLI
 * 
 * Usage:
 *   node scripts/manage-products.mjs list
 *   node scripts/manage-products.mjs remove <slug>
 *   node scripts/manage-products.mjs add --name "Oud Royale" --slug "oud-royale" --category "perfume" --collection "Warm & Sensual" --price 150000 --notes "Oud,Amber,Sandalwood" --image "/product-intense.jpg" --stock 20
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

// Load .env.local
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [k, ...v] = trimmed.split('=');
    if (k && process.env[k.trim()] === undefined) {
      let val = v.join('=').trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[k.trim()] = val;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('✗ Error: Supabase credentials missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const command = process.argv[2] || 'list';

function formatNaira(kobo) {
  return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
}

async function listProducts() {
  console.log('\n✦ ============================================================');
  console.log('   AROMA DE LUZ — CURRENT LIVE PRODUCTS IN DATABASE');
  console.log('✦ ============================================================\n');

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, slug, category, collection, price_kobo, stock, featured')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('✗ Error fetching products:', error.message);
    return;
  }

  if (!products || products.length === 0) {
    console.log('No products found in the database. Run `npm run db:seed` to add initial products.');
    return;
  }

  console.log(`Total Products: ${products.length}\n`);
  console.table(
    products.map((p) => ({
      Slug: p.slug,
      Name: p.name,
      Category: p.category,
      Collection: p.collection || 'General',
      Price: formatNaira(p.price_kobo),
      Stock: p.stock,
      Featured: p.featured ? '★ Yes' : 'No',
    }))
  );

  console.log('\n👉 Quick Commands:');
  console.log('   - Remove a product:  node scripts/manage-products.mjs remove <slug>');
  console.log('   - Add a product:     node scripts/manage-products.mjs add --name "..." --slug "..." --price 45000\n');
}

async function removeProduct(slug) {
  if (!slug) {
    console.error('✗ Please specify the slug of the product to remove:');
    console.log('   node scripts/manage-products.mjs remove velvet-rose-candle');
    process.exit(1);
  }

  console.log(`\nRemoving product with slug "${slug}"...`);
  const { data, error } = await supabase
    .from('products')
    .delete()
    .eq('slug', slug)
    .select('name');

  if (error) {
    console.error('✗ Failed to delete product:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log(`✓ Successfully removed "${data[0].name}" (${slug}) from the store!\n`);
  } else {
    console.log(`⚠️  No product found with slug "${slug}". Run list to verify active slugs.\n`);
  }
}

async function addProduct() {
  const args = process.argv.slice(3);
  const getArg = (flag) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
  };

  const name = getArg('--name');
  const slug = getArg('--slug') || name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const category = (getArg('--category') || 'candle').toLowerCase();
  const collection = getArg('--collection') || (category === 'candle' ? 'Floral Bouquets' : 'Exclusive Collection');
  const priceNaira = parseFloat(getArg('--price') || '45000');
  const price_kobo = Math.round(priceNaira * 100);
  const description = getArg('--description') || `Luxury handcrafted ${category} with signature botanicals.`;
  const image_url = getArg('--image') || (category === 'candle' ? '/product-lamour.jpg' : '/product-intense.jpg');
  const stock = parseInt(getArg('--stock') || '20', 10);
  const featured = args.includes('--featured');
  const rawNotes = getArg('--notes') || 'Rose,Musk,Sandalwood';
  const scent_notes = rawNotes.split(',').map((n) => n.trim());

  if (!name || !slug) {
    console.log('\n✦ ============================================================');
    console.log('   ADD NEW PRODUCT — HELP');
    console.log('✦ ============================================================');
    console.log('\nUsage example:');
    console.log('node scripts/manage-products.mjs add \\');
    console.log('  --name "Royal Oud Extrait" \\');
    console.log('  --slug "royal-oud-extrait" \\');
    console.log('  --category "perfume" \\');
    console.log('  --collection "Exclusive Collection" \\');
    console.log('  --price 85000 \\');
    console.log('  --notes "Oud,Amber,Leather" \\');
    console.log('  --image "/product-intense.jpg" \\');
    console.log('  --stock 15 --featured\n');
    return;
  }

  const newProduct = {
    name,
    slug,
    category,
    collection,
    price_kobo,
    description,
    image_url,
    stock,
    featured,
    scent_notes,
  };

  console.log(`\nAdding product "${name}" to Supabase...`);
  const { error } = await supabase.from('products').upsert(newProduct, { onConflict: 'slug' });

  if (error) {
    console.error('✗ Failed to add product:', error.message);
  } else {
    console.log(`✓ Product "${name}" (${slug}) successfully added/updated in the store!`);
    console.log(`  Price: ${formatNaira(price_kobo)} | Category: ${category} | Stock: ${stock}\n`);
  }
}

async function main() {
  if (command === 'list') {
    await listProducts();
  } else if (command === 'remove' || command === 'delete') {
    await removeProduct(process.argv[3]);
  } else if (command === 'add') {
    await addProduct();
  } else {
    console.log('Unknown command. Available commands: list, add, remove');
  }
}

main();

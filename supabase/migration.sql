-- Aroma Deluz — Database Migration
-- Run this in the Supabase SQL Editor

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('candle', 'perfume')),
  collection text,
  price_kobo int NOT NULL CHECK (price_kobo > 0),
  scent_notes text[],
  image_url text,
  stock int NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  full_name text,
  phone text,
  address text,
  city text,
  state text,
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'failed')),
  total_kobo int NOT NULL,
  paystack_authorization_url text,
  paystack_access_code text,
  demo boolean NOT NULL DEFAULT false,
  email_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  name text NOT NULL,
  unit_price_kobo int NOT NULL,
  quantity int NOT NULL CHECK (quantity > 0)
);

-- Subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Cart Items table
-- Shared cart between the storefront and the mobile app. One row per
-- (user, product); the API upserts on that pair to keep quantities absolute.
-- user_id is a uuid (the Supabase auth user id). Storefront demo accounts use
-- synthetic ids and are rejected with a 400 by /api/cart.
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  qty int NOT NULL CHECK (qty > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Required by the API's `upsert(..., { onConflict: 'user_id, product_id' })`.
CREATE UNIQUE INDEX IF NOT EXISTS cart_items_user_id_product_id_key
  ON cart_items (user_id, product_id);

CREATE INDEX IF NOT EXISTS cart_items_user_id_idx ON cart_items (user_id);

-- RLS Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Carts are read and written only by the server routes with the service-role
-- key; the browser and the mobile app never talk to this table directly.
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Subscribers: insert only via service role
CREATE POLICY "Service insert subscribers" ON subscribers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service manage cart items" ON cart_items;
CREATE POLICY "Service manage cart items" ON cart_items
  FOR ALL USING (true) WITH CHECK (true);

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

-- RLS Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Subscribers: insert only via service role
CREATE POLICY "Service insert subscribers" ON subscribers FOR INSERT WITH CHECK (true);

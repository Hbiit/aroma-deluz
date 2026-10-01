-- Aroma Deluz — Seed Data: 12 Products (6 candles, 6 perfumes)

INSERT INTO products (slug, name, description, category, collection, price_kobo, scent_notes, image_url, stock, featured)
VALUES
  -- Candles
  ('velvet-rose-candle', 'Velvet Rose', 'A rich, opulent candle with deep rose and velvety musk undertones.', 'candle', 'Floral Bouquets', 4500000, ARRAY['Damask Rose', 'Musk', 'Sandalwood'], '/product-lamour.jpg', 25, true),
  ('amber-oud-candle', 'Amber Oud', 'Warm amber and precious oud wood create an intoxicating atmosphere.', 'candle', 'Warm & Sensual', 5200000, ARRAY['Amber', 'Oud', 'Vanilla'], '/product-rose-noir.jpg', 18, true),
  ('citrus-garden-candle', 'Citrus Garden', 'Bright bergamot and lemon verbena uplift every room.', 'candle', 'Fresh & Radiant', 3800000, ARRAY['Bergamot', 'Lemon Verbena', 'Green Tea'], '/product-eau-lumiere.jpg', 30, false),
  ('midnight-jasmine-candle', 'Midnight Jasmine', 'Night-blooming jasmine with a hint of starlit mystery.', 'candle', 'Exclusive Collection', 6800000, ARRAY['Jasmine', 'Tuberose', 'Dark Amber'], '/product-jardin.jpg', 12, false),
  ('lavender-dreams-candle', 'Lavender Dreams', 'Calming French lavender paired with soft vanilla.', 'candle', 'Floral Bouquets', 4200000, ARRAY['Lavender', 'Vanilla', 'Tonka Bean'], '/product-intense.jpg', 20, false),
  ('spiced-cedar-candle', 'Spiced Cedar', 'A warm, earthy blend of cedar bark and exotic spices.', 'candle', 'Warm & Sensual', 4800000, ARRAY['Cedar', 'Cinnamon', 'Cardamom'], '/product-rose-noir.jpg', 15, false),

  -- Perfumes
  ('lamour-perfume', 'L''Amour', 'A captivating floral fragrance that embodies romance and elegance.', 'perfume', 'Floral Bouquets', 12800000, ARRAY['Rose', 'Peony', 'White Musk'], '/product-lamour.jpg', 20, true),
  ('rose-noir-perfume', 'Rose Noir', 'A dark, sophisticated rose with smoky oud and leather accents.', 'perfume', 'Warm & Sensual', 15800000, ARRAY['Dark Rose', 'Oud', 'Leather'], '/product-rose-noir.jpg', 15, true),
  ('eau-de-lumiere', 'Eau de Lumière', 'Radiant and luminous — citrus sparkle meets golden warmth.', 'perfume', 'Fresh & Radiant', 12800000, ARRAY['Bergamot', 'Neroli', 'Amber'], '/product-eau-lumiere.jpg', 22, true),
  ('jardin-secrete', 'Jardin Secrète', 'A hidden garden of white florals and fresh green notes.', 'perfume', 'Fresh & Radiant', 11500000, ARRAY['Lily of Valley', 'Green Fig', 'White Cedar'], '/product-jardin.jpg', 28, true),
  ('aroma-intense', 'Aroma Intense', 'The signature house perfume — bold, rich, and unforgettable.', 'perfume', 'Exclusive Collection', 16800000, ARRAY['Saffron', 'Oud', 'Ambergris'], '/product-intense.jpg', 10, true),
  ('golden-dusk', 'Golden Dusk', 'Sunset captured in a bottle — warm, golden, and irresistible.', 'perfume', 'Exclusive Collection', 18500000, ARRAY['Gold Amber', 'Iris', 'Praline'], '/product-eau-lumiere.jpg', 8, false)
ON CONFLICT (slug) DO NOTHING;

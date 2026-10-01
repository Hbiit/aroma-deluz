// Aroma Deluz — In-Memory Store (Demo Mode)
// Used when Supabase env vars are absent. Provides 12 seeded products.

import { Product, Order, OrderItem } from '@/lib/types';

const seededProducts: Product[] = [
  // Candles
  {
    id: 'c1', slug: 'velvet-rose-candle', name: 'Velvet Rose',
    description: 'A rich, opulent candle with deep rose and velvety musk undertones.',
    category: 'candle', collection: 'Floral Bouquets', price_kobo: 4500000,
    scent_notes: ['Damask Rose', 'Musk', 'Sandalwood'],
    image_url: '/product-lamour.jpg', stock: 25, featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c2', slug: 'amber-oud-candle', name: 'Amber Oud',
    description: 'Warm amber and precious oud wood create an intoxicating atmosphere.',
    category: 'candle', collection: 'Warm & Sensual', price_kobo: 5200000,
    scent_notes: ['Amber', 'Oud', 'Vanilla'],
    image_url: '/product-rose-noir.jpg', stock: 18, featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c3', slug: 'citrus-garden-candle', name: 'Citrus Garden',
    description: 'Bright bergamot and lemon verbena uplift every room.',
    category: 'candle', collection: 'Fresh & Radiant', price_kobo: 3800000,
    scent_notes: ['Bergamot', 'Lemon Verbena', 'Green Tea'],
    image_url: '/product-eau-lumiere.jpg', stock: 30, featured: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c4', slug: 'midnight-jasmine-candle', name: 'Midnight Jasmine',
    description: 'Night-blooming jasmine with a hint of starlit mystery.',
    category: 'candle', collection: 'Exclusive Collection', price_kobo: 6800000,
    scent_notes: ['Jasmine', 'Tuberose', 'Dark Amber'],
    image_url: '/product-jardin.jpg', stock: 12, featured: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c5', slug: 'lavender-dreams-candle', name: 'Lavender Dreams',
    description: 'Calming French lavender paired with soft vanilla.',
    category: 'candle', collection: 'Floral Bouquets', price_kobo: 4200000,
    scent_notes: ['Lavender', 'Vanilla', 'Tonka Bean'],
    image_url: '/product-intense.jpg', stock: 20, featured: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c6', slug: 'spiced-cedar-candle', name: 'Spiced Cedar',
    description: 'A warm, earthy blend of cedar bark and exotic spices.',
    category: 'candle', collection: 'Warm & Sensual', price_kobo: 4800000,
    scent_notes: ['Cedar', 'Cinnamon', 'Cardamom'],
    image_url: '/product-rose-noir.jpg', stock: 15, featured: false,
    created_at: new Date().toISOString(),
  },
  // Perfumes
  {
    id: 'p1', slug: 'lamour-perfume', name: "L'Amour",
    description: 'A captivating floral fragrance that embodies romance and elegance.',
    category: 'perfume', collection: 'Floral Bouquets', price_kobo: 12800000,
    scent_notes: ['Rose', 'Peony', 'White Musk'],
    image_url: '/product-lamour.jpg', stock: 20, featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'p2', slug: 'rose-noir-perfume', name: 'Rose Noir',
    description: 'A dark, sophisticated rose with smoky oud and leather accents.',
    category: 'perfume', collection: 'Warm & Sensual', price_kobo: 15800000,
    scent_notes: ['Dark Rose', 'Oud', 'Leather'],
    image_url: '/product-rose-noir.jpg', stock: 15, featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'p3', slug: 'eau-de-lumiere', name: 'Eau de Lumière',
    description: 'Radiant and luminous — citrus sparkle meets golden warmth.',
    category: 'perfume', collection: 'Fresh & Radiant', price_kobo: 12800000,
    scent_notes: ['Bergamot', 'Neroli', 'Amber'],
    image_url: '/product-eau-lumiere.jpg', stock: 22, featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'p4', slug: 'jardin-secrete', name: 'Jardin Secrète',
    description: 'A hidden garden of white florals and fresh green notes.',
    category: 'perfume', collection: 'Fresh & Radiant', price_kobo: 11500000,
    scent_notes: ['Lily of Valley', 'Green Fig', 'White Cedar'],
    image_url: '/product-jardin.jpg', stock: 28, featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'p5', slug: 'aroma-intense', name: 'Aroma Intense',
    description: 'The signature house perfume — bold, rich, and unforgettable.',
    category: 'perfume', collection: 'Exclusive Collection', price_kobo: 16800000,
    scent_notes: ['Saffron', 'Oud', 'Ambergris'],
    image_url: '/product-intense.jpg', stock: 10, featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'p6', slug: 'golden-dusk', name: 'Golden Dusk',
    description: 'Sunset captured in a bottle — warm, golden, and irresistible.',
    category: 'perfume', collection: 'Exclusive Collection', price_kobo: 18500000,
    scent_notes: ['Gold Amber', 'Iris', 'Praline'],
    image_url: '/product-eau-lumiere.jpg', stock: 8, featured: false,
    created_at: new Date().toISOString(),
  },
];

// In-memory stores for demo mode
const orders: (Order & { items: OrderItem[] })[] = [];
const subscribers: { id: string; email: string; created_at: string }[] = [];

export const memoryStore = {
  // Products
  getProducts(): Product[] {
    return seededProducts;
  },

  getFeaturedProducts(): Product[] {
    return seededProducts.filter(p => p.featured);
  },

  getProductBySlug(slug: string): Product | undefined {
    return seededProducts.find(p => p.slug === slug);
  },

  getProductById(id: string): Product | undefined {
    return seededProducts.find(p => p.id === id);
  },

  getProductsByCategory(category: string): Product[] {
    return seededProducts.filter(p => p.category === category);
  },

  getProductsByCollection(collection: string): Product[] {
    return seededProducts.filter(p => p.collection === collection);
  },

  // Orders
  createOrder(order: Order, items: OrderItem[]): Order {
    orders.push({ ...order, items });
    return order;
  },

  getOrderByReference(reference: string) {
    return orders.find(o => o.reference === reference);
  },

  updateOrderStatus(reference: string, status: Order['status']) {
    const order = orders.find(o => o.reference === reference);
    if (order) order.status = status;
    return order;
  },

  markEmailSent(reference: string) {
    const order = orders.find(o => o.reference === reference);
    if (order) order.email_sent_at = new Date().toISOString();
    return order;
  },

  // Subscribers
  addSubscriber(email: string) {
    const existing = subscribers.find(s => s.email === email);
    if (existing) return existing;
    const sub = { id: crypto.randomUUID(), email, created_at: new Date().toISOString() };
    subscribers.push(sub);
    return sub;
  },
};

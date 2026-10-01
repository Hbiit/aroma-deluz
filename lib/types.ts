// Aroma Deluz — Core Types

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: 'candle' | 'perfume';
  collection: string | null;
  price_kobo: number;
  scent_notes: string[];
  image_url: string | null;
  stock: number;
  featured: boolean;
  created_at: string;
}

export interface CartItem {
  id: string;
  slug: string;
  name: string;
  price_kobo: number;
  image_url: string;
  qty: number;
}

export interface Order {
  id: string;
  reference: string;
  user_id: string | null;
  email: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  note: string | null;
  status: 'pending' | 'paid' | 'cancelled' | 'failed';
  total_kobo: number;
  paystack_authorization_url: string | null;
  paystack_access_code: string | null;
  demo: boolean;
  email_sent_at: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  unit_price_kobo: number;
  quantity: number;
}

export interface CheckoutFormData {
  email: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  note: string;
}

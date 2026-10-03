export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  category: 'candles' | 'perfumes' | string;
  description: string;
  price_kobo: number;
  image_url: string;
  notes_top?: string[];
  notes_heart?: string[];
  notes_base?: string[];
  size_label?: string;
  rating?: number;
  review_count?: number;
  featured?: boolean;
}

export interface CartItem {
  id: string;
  slug?: string;
  name: string;
  price_kobo: number;
  image_url: string;
  qty: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

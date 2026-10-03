import { CartItem, Product } from '../types';

export const API_BASE_URL = 'http://localhost:3000';
export const FALLBACK_API_BASE_URL = 'https://aroma-deluz.vercel.app';

async function fetchWithFallback(endpoint: string, options?: RequestInit): Promise<Response> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (res.ok) return res;
  } catch (e) {
    // Localhost might not be reachable or dev server not on default host
  }

  return fetch(`${FALLBACK_API_BASE_URL}${endpoint}`, options);
}

export async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetchWithFallback('/api/products');
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('Error fetching products:', error);
    return [];
  }
}

export async function getUserCart(userId: string): Promise<CartItem[]> {
  if (!userId) return [];
  try {
    const res = await fetchWithFallback(`/api/cart?userId=${encodeURIComponent(userId)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.items) ? data.items : [];
  } catch (error) {
    console.warn('Error fetching remote cart:', error);
    return [];
  }
}

export async function saveUserCart(userId: string, items: CartItem[]): Promise<boolean> {
  if (!userId) return false;
  try {
    const res = await fetchWithFallback('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, items }),
    });
    return res.ok;
  } catch (error) {
    console.warn('Error saving remote cart:', error);
    return false;
  }
}

export async function clearUserCart(userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const res = await fetchWithFallback(`/api/cart?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (error) {
    console.warn('Error clearing remote cart:', error);
    return false;
  }
}

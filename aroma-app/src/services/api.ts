import { CartItem, Product } from '../types';
import { supabase } from './supabase';
import { FALLBACK_PRODUCTS } from '../constants/products';

export const API_BASE_URL = 'https://aroma-deluz.vercel.app';

async function fetchApi(endpoint: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  try {
    return await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetchApi('/api/products');
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) return data;
  } catch (error) {
    console.warn('Notice fetching products from API, falling back to local catalog:', error);
  }

  try {
    const { data } = await supabase.from('products').select('*');
    if (Array.isArray(data) && data.length > 0) return data;
  } catch {}

  return FALLBACK_PRODUCTS;
}

export async function getUserCart(userId: string): Promise<CartItem[]> {
  if (!userId) return [];

  // 1. Try server API
  try {
    const res = await fetchApi(`/api/cart?userId=${encodeURIComponent(userId)}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.items)) {
        return data.items;
      }
    }
  } catch (error) {
    console.warn('Server API cart fetch failed, checking Supabase session:', error);
  }

  // 2. Fallback to direct Supabase user metadata
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === userId && Array.isArray(user.user_metadata?.cart)) {
      return user.user_metadata.cart;
    }
  } catch (err) {
    console.warn('Direct Supabase cart fetch error:', err);
  }

  return [];
}

export async function saveUserCart(userId: string, items: CartItem[]): Promise<boolean> {
  if (!userId) return false;
  let savedToSupabase = false;
  let savedToApi = false;

  // 1. Direct Supabase update if session is active
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === userId) {
      const { error } = await supabase.auth.updateUser({
        data: {
          cart: items,
          cart_updated_at: new Date().toISOString(),
        },
      });
      if (!error) savedToSupabase = true;
    }
  } catch (err) {
    console.warn('Direct Supabase cart update error:', err);
  }

  // 2. Also sync to backend API endpoint
  try {
    const res = await fetchApi('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, items }),
    });
    if (res.ok) savedToApi = true;
  } catch (error) {
    console.warn('Server API cart save error:', error);
  }

  return savedToSupabase || savedToApi;
}

export async function clearUserCart(userId: string): Promise<boolean> {
  if (!userId) return false;

  // 1. Clear in Supabase user metadata
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === userId) {
      await supabase.auth.updateUser({
        data: {
          cart: [],
          cart_updated_at: new Date().toISOString(),
        },
      });
    }
  } catch (err) {
    console.warn('Direct Supabase cart clear error:', err);
  }

  // 2. Clear via server API
  try {
    await fetchApi(`/api/cart?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn('Server API cart clear error:', error);
  }

  return true;
}


export async function getUserOrders(userId?: string, email?: string): Promise<any[]> {
  if (!userId && !email) return [];
  try {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (email) params.append('email', email);
    const res = await fetchApi(`/api/user/orders?${params.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.orders) ? data.orders : [];
  } catch (error) {
    console.warn('Error fetching user orders:', error);
    return [];
  }
}

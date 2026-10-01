// Aroma Deluz — Data Access Layer
// Abstracts Supabase vs in-memory store

import { Product } from '@/lib/types';
import { memoryStore } from '@/lib/store';

async function getSupabaseClient() {
  const { createServerSupabaseClient } = await import('@/lib/supabase/server');
  return createServerSupabaseClient();
}

export async function getProducts(filters?: {
  category?: string;
  collection?: string;
}): Promise<Product[]> {
  const supabase = await getSupabaseClient();

  if (!supabase) {
    let products = memoryStore.getProducts();
    if (filters?.category) products = products.filter(p => p.category === filters.category);
    if (filters?.collection) products = products.filter(p => p.collection === filters.collection);
    return products;
  }

  let query = supabase.from('products').select('*').order('created_at', { ascending: false });
  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.collection) query = query.eq('collection', filters.collection);

  const { data, error } = await query;
  if (error) throw error;
  return (data as Product[]) ?? [];
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const supabase = await getSupabaseClient();

  if (!supabase) return memoryStore.getFeaturedProducts();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('featured', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Product[]) ?? [];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await getSupabaseClient();

  if (!supabase) return memoryStore.getProductBySlug(slug) ?? null;

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data as Product;
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await getSupabaseClient();

  if (!supabase) return memoryStore.getProductById(id) ?? null;

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as Product;
}

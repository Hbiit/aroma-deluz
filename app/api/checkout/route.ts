// Aroma Deluz — Checkout API Route
import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reference, userId, email, fullName, phone, address, city, state, note, items, totalKobo } = body;

    const supabase = createServiceRoleClient() || (await createServerSupabaseClient());

    if (supabase) {
      // 1. Insert order into Supabase
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          reference,
          user_id: userId || null,
          email,
          full_name: fullName,
          phone,
          address,
          city,
          state,
          note,
          status: 'paid', // Mark as paid for demo/test orders
          total_kobo: totalKobo,
          demo: !process.env.PAYSTACK_SECRET_KEY,
        })
        .select()
        .single();

      if (!orderError && orderData && items && items.length > 0) {
        // 2. Insert order items
        const orderItemsPayload = items.map((item: any) => ({
          order_id: orderData.id,
          product_id: item.id.length > 30 ? item.id : null,
          name: item.name,
          unit_price_kobo: item.price_kobo,
          quantity: item.quantity,
        }));

        await supabase.from('order_items').insert(orderItemsPayload);
      }
    }

    return NextResponse.json({ success: true, reference });
  } catch (error: any) {
    console.error('Checkout API error:', error);
    return NextResponse.json({ error: error.message || 'Checkout failed' }, { status: 500 });
  }
}

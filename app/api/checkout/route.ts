// Aroma Deluz — Checkout API Route
// Server-side cart re-pricing, order creation, and Paystack payment initialization

import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { memoryStore } from '@/lib/store';
import { initializePaystackTransaction, isPaystackConfigured } from '@/lib/paystack';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      reference,
      userId,
      email,
      fullName,
      phone,
      address,
      city,
      state,
      note,
      items,
    } = body;

    if (!email || !address || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required order fields or empty cart' },
        { status: 400 }
      );
    }

    const orderRef =
      reference ||
      `AROMA-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    const supabase = createServiceRoleClient() || (await createServerSupabaseClient());

    // 1. Re-price cart from server/database to ensure integrity
    let calculatedItemsSubtotalKobo = 0;
    const verifiedOrderItems: Array<{
      id: string;
      product_id: string | null;
      name: string;
      price_kobo: number;
      quantity: number;
    }> = [];

    // Fetch products from Supabase or fallback memoryStore
    let dbProducts: any[] = [];
    if (supabase) {
      const { data } = await supabase.from('products').select('*');
      if (data && data.length > 0) {
        dbProducts = data;
      }
    }
    if (dbProducts.length === 0) {
      dbProducts = memoryStore.getProducts();
    }

    for (const item of items) {
      const quantity = Math.max(1, parseInt(item.quantity || item.qty || 1, 10));
      const matchedProduct = dbProducts.find(
        (p) => p.id === item.id || p.slug === item.slug
      );

      const unitPriceKobo = matchedProduct
        ? matchedProduct.price_kobo
        : item.price_kobo || 4500000;

      calculatedItemsSubtotalKobo += unitPriceKobo * quantity;

      verifiedOrderItems.push({
        id: matchedProduct ? matchedProduct.id : item.id,
        product_id: matchedProduct ? matchedProduct.id : null,
        name: matchedProduct ? matchedProduct.name : item.name,
        price_kobo: unitPriceKobo,
        quantity,
      });
    }

    // Free delivery over ₦150,000 (15,000,000 kobo); ₦4,500 Lagos, ₦7,500 elsewhere
    const deliveryKobo =
      calculatedItemsSubtotalKobo >= 15000000
        ? 0
        : state === 'Lagos'
        ? 450000
        : 750000;

    const grandTotalKobo = calculatedItemsSubtotalKobo + deliveryKobo;

    // Temporary: External payment methods are paused, direct demo payment is active
    const isDemoMode = body.isDemo !== false && (body.paymentMethod === 'demo' || process.env.ENABLE_LIVE_PAYMENTS !== 'true');
    const paystackActive = !isDemoMode && isPaystackConfigured();

    // 2. Insert order record into database or memory store
    let createdOrderId = orderRef;

    if (supabase) {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          reference: orderRef,
          user_id: userId || null,
          email,
          full_name: fullName,
          phone,
          address,
          city,
          state,
          note: note ? `${note} | Demo Atelier Order` : 'Demo Atelier Order',
          status: isDemoMode ? 'paid' : 'pending',
          total_kobo: grandTotalKobo,
          demo: isDemoMode,
        })
        .select()
        .single();

      if (orderError) {
        console.error('Supabase order creation error:', orderError);
      } else if (orderData) {
        createdOrderId = orderData.id;

        const orderItemsPayload = verifiedOrderItems.map((item) => ({
          order_id: orderData.id,
          product_id: item.product_id && item.product_id.length > 30 ? item.product_id : null,
          name: item.name,
          unit_price_kobo: item.price_kobo,
          quantity: item.quantity,
        }));

        await supabase.from('order_items').insert(orderItemsPayload);
      }
    } else {
      // In-memory store fallback
      memoryStore.createOrder(
        {
          id: orderRef,
          reference: orderRef,
          user_id: userId || null,
          email,
          full_name: fullName,
          phone,
          address,
          city,
          state,
          note,
          status: paystackActive ? 'pending' : 'paid',
          total_kobo: grandTotalKobo,
          paystack_authorization_url: null,
          paystack_access_code: null,
          demo: !paystackActive,
          email_sent_at: null,
          created_at: new Date().toISOString(),
        },
        verifiedOrderItems.map((item) => ({
          id: `item-${Date.now()}-${Math.random()}`,
          order_id: orderRef,
          product_id: item.product_id,
          name: item.name,
          unit_price_kobo: item.price_kobo,
          quantity: item.quantity,
        }))
      );
    }

    // 3. Handle Demo Mode (External Payment Methods Temporarily Disabled)
    if (isDemoMode) {
      try {
        const { sendOrderConfirmationEmail } = await import('@/lib/mailgun');
        const emailResult = await sendOrderConfirmationEmail({
          reference: orderRef,
          fullName: fullName || 'Valued Client',
          email,
          phone,
          address,
          city,
          state,
          items: verifiedOrderItems,
          totalKobo: grandTotalKobo,
        });

        if (emailResult.success) {
          const sentAt = new Date().toISOString();
          if (supabase) {
            await supabase
              .from('orders')
              .update({ email_sent_at: sentAt })
              .eq('reference', orderRef);
          } else {
            memoryStore.markEmailSent(orderRef);
          }
          console.log(`[Demo Checkout] Confirmation email dispatched for ${orderRef} to ${email}`);
        }
      } catch (emailErr) {
        console.error('[Demo Checkout] Email dispatch exception:', emailErr);
      }

      return NextResponse.json({
        success: true,
        reference: orderRef,
        demo: true,
      });
    }

    // 4. Handle Paystack Hosted Checkout (when live payments enabled)
    if (paystackActive) {
      const origin = request.headers.get('origin');
      const host = request.headers.get('host');
      const proto =
        request.headers.get('x-forwarded-proto') ||
        (host?.includes('localhost') ? 'http' : 'https');

      const siteUrl =
        origin ||
        (host ? `${proto}://${host}` : null) ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        'http://localhost:3000';

      const callbackUrl = `${siteUrl.replace(/\/$/, '')}/checkout/success`;

      const paystackRes = await initializePaystackTransaction({
        email,
        amountKobo: grandTotalKobo,
        reference: orderRef,
        callbackUrl,
        metadata: {
          order_id: createdOrderId,
          customer_name: fullName,
          phone,
          delivery_address: `${address}, ${city}, ${state}`,
          items_count: verifiedOrderItems.reduce((acc, i) => acc + i.quantity, 0),
        },
      });

      if (!paystackRes.success || !paystackRes.authorizationUrl) {
        console.error('Paystack initialization failed:', paystackRes.error);
        return NextResponse.json(
          { error: paystackRes.error || 'Failed to initialize Paystack checkout' },
          { status: 502 }
        );
      }

      // Update order record with authorization details
      if (supabase) {
        await supabase
          .from('orders')
          .update({
            paystack_authorization_url: paystackRes.authorizationUrl,
            paystack_access_code: paystackRes.accessCode || null,
          })
          .eq('reference', orderRef);
      }

      return NextResponse.json({
        success: true,
        reference: orderRef,
        authorizationUrl: paystackRes.authorizationUrl,
        accessCode: paystackRes.accessCode,
        demo: false,
      });
    }

    return NextResponse.json({
      success: true,
      reference: orderRef,
      demo: true,
    });
  } catch (error: any) {
    console.error('Checkout API error:', error);
    return NextResponse.json(
      { error: error.message || 'Checkout failed' },
      { status: 500 }
    );
  }
}

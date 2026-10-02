// Aroma Deluz — Order Verification Route
// GET /api/orders/[reference]
// Verifies transaction directly with Paystack API, updates status to paid, and triggers confirmation email once

import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { memoryStore } from '@/lib/store';
import { verifyPaystackTransaction, isPaystackConfigured } from '@/lib/paystack';

export async function GET(
  request: Request,
  context: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await context.params;

    if (!reference) {
      return NextResponse.json({ error: 'Order reference required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient() || (await createServerSupabaseClient());

    let order: any = null;
    let items: any[] = [];

    // 1. Fetch order from Supabase or memory store
    if (supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('reference', reference)
        .maybeSingle();

      if (!error && data) {
        order = data;
        items = data.order_items || [];
      }
    }

    if (!order) {
      order = memoryStore.getOrderByReference(reference);
      if (order) {
        items = order.items || [];
      }
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const paystackActive = isPaystackConfigured();

    // 2. If already paid, return confirmed order
    if (order.status === 'paid') {
      return NextResponse.json({
        success: true,
        order,
        items,
        verified: true,
        demo: Boolean(order.demo),
      });
    }

    // 3. Demo mode verification (no Paystack key)
    if (!paystackActive || order.demo) {
      if (order.status !== 'paid') {
        if (supabase) {
          await supabase.from('orders').update({ status: 'paid' }).eq('reference', reference);
          order.status = 'paid';
        } else {
          memoryStore.updateOrderStatus(reference, 'paid');
          order.status = 'paid';
        }
      }
      return NextResponse.json({
        success: true,
        order,
        items,
        verified: true,
        demo: true,
      });
    }

    // 4. Verify transaction with Paystack API
    const paystackRes = await verifyPaystackTransaction(reference);

    if (!paystackRes.success || !paystackRes.data) {
      return NextResponse.json({
        success: false,
        error: paystackRes.error || 'Unable to verify payment with Paystack',
        order,
        verified: false,
      });
    }

    const paystackData = paystackRes.data;

    // Check if status is success and paid amount matches order total
    if (
      paystackData.status === 'success' &&
      paystackData.amount >= order.total_kobo
    ) {
      // Mark order as paid
      if (supabase) {
        const { data: updated } = await supabase
          .from('orders')
          .update({
            status: 'paid',
          })
          .eq('reference', reference)
          .select()
          .single();
        if (updated) order = { ...updated, order_items: items };
      } else {
        memoryStore.updateOrderStatus(reference, 'paid');
        order.status = 'paid';
      }

      // Send Mailgun order confirmation email ONCE
      if (!order.email_sent_at) {
        try {
          const { sendOrderConfirmationEmail } = await import('@/lib/mailgun');
          await sendOrderConfirmationEmail({
            reference: order.reference,
            fullName: order.full_name || 'Valued Client',
            email: order.email,
            phone: order.phone,
            address: order.address || '',
            city: order.city || 'Lagos',
            state: order.state || 'Lagos',
            items: items.map((i: any) => ({
              name: i.name,
              qty: i.quantity,
              price_kobo: i.unit_price_kobo,
            })),
            totalKobo: order.total_kobo,
          });

          // Guard against duplicate emails
          if (supabase) {
            await supabase
              .from('orders')
              .update({ email_sent_at: new Date().toISOString() })
              .eq('reference', reference);
          } else {
            memoryStore.markEmailSent(reference);
          }
        } catch (emailErr) {
          console.error('[Mailgun Order Email Error]:', emailErr);
        }
      }

      return NextResponse.json({
        success: true,
        order,
        items,
        verified: true,
        gatewayResponse: paystackData.gateway_response,
        demo: false,
      });
    }

    // Payment failed or incomplete
    return NextResponse.json({
      success: false,
      order,
      verified: false,
      paystackStatus: paystackData.status,
      message: paystackData.gateway_response || 'Payment not completed',
    });
  } catch (error: any) {
    console.error('Order verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}

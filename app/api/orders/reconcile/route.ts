// Aroma Deluz — Automated Order Reconciliation Service
// GET /api/orders/reconcile
// Automatically finds pending orders, verifies them against Paystack, updates status, and dispatches Brevo confirmation emails.

import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { verifyPaystackTransaction, isPaystackConfigured } from '@/lib/paystack';
import { sendOrderConfirmationEmail } from '@/lib/mailgun';

export async function GET(request: Request) {
  try {
    if (!isPaystackConfigured()) {
      return NextResponse.json({ message: 'Paystack is not configured' }, { status: 200 });
    }

    const supabase = createServiceRoleClient() || (await createServerSupabaseClient());
    if (!supabase) {
      return NextResponse.json({ message: 'Database client unavailable' }, { status: 200 });
    }

    // 1. Fetch all pending orders from the past 48 hours
    const sinceDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: pendingOrders, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('status', 'pending')
      .gte('created_at', sinceDate)
      .limit(20);

    if (error) {
      console.error('[Reconciliation] Error fetching pending orders:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!pendingOrders || pendingOrders.length === 0) {
      return NextResponse.json({
        success: true,
        reconciled: 0,
        message: 'No pending orders to reconcile.',
      });
    }

    console.log(`[Reconciliation] Checking ${pendingOrders.length} pending orders with Paystack...`);

    const results = [];

    // 2. Iterate and verify each order directly with Paystack
    for (const order of pendingOrders) {
      try {
        const paystackRes = await verifyPaystackTransaction(order.reference);

        if (
          paystackRes.success &&
          paystackRes.data &&
          paystackRes.data.status === 'success' &&
          paystackRes.data.amount >= order.total_kobo
        ) {
          console.log(`[Reconciliation] Order ${order.reference} was paid! Updating status...`);

          // Mark as paid
          await supabase
            .from('orders')
            .update({ status: 'paid' })
            .eq('reference', order.reference);

          // Dispatch confirmation email if not yet sent
          if (!order.email_sent_at) {
            const items = order.order_items || [];
            const emailRes = await sendOrderConfirmationEmail({
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

            console.log(`[Reconciliation] Email dispatched for ${order.reference}:`, emailRes);

            await supabase
              .from('orders')
              .update({ email_sent_at: new Date().toISOString() })
              .eq('reference', order.reference);
          }

          results.push({
            reference: order.reference,
            customer: order.email,
            status: 'reconciled_paid',
          });
        } else {
          results.push({
            reference: order.reference,
            status: paystackRes.data?.status || 'unpaid',
          });
        }
      } catch (err: any) {
        console.error(`[Reconciliation] Error on ${order.reference}:`, err.message);
        results.push({ reference: order.reference, error: err.message });
      }
    }

    const newlyPaid = results.filter((r) => r.status === 'reconciled_paid').length;

    return NextResponse.json({
      success: true,
      totalChecked: pendingOrders.length,
      reconciled: newlyPaid,
      results,
    });
  } catch (error: any) {
    console.error('[Reconciliation Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

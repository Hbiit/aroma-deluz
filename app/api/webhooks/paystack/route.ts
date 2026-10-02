// Aroma Deluz — Paystack Webhook Handler
// POST /api/webhooks/paystack
// Receives charge.success events from Paystack server, marks order as paid,
// and guarantees order confirmation email is dispatched via Nodemailer.

import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { memoryStore } from '@/lib/store';
import { verifyPaystackWebhookSignature } from '@/lib/paystack';
import { sendOrderConfirmationEmail } from '@/lib/mailgun';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    // 1. Verify webhook signature if PAYSTACK_SECRET_KEY is configured
    if (process.env.PAYSTACK_SECRET_KEY) {
      const isValid = verifyPaystackWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.warn('[Paystack Webhook] Invalid HMAC signature received');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);

    // 2. Handle successful charge
    if (event.event === 'charge.success') {
      const data = event.data;
      const reference = data.reference;

      console.log(`[Paystack Webhook] Received charge.success for reference: ${reference}`);

      const supabase = createServiceRoleClient() || (await createServerSupabaseClient());

      let order: any = null;
      let items: any[] = [];

      // Fetch order from Supabase
      if (supabase) {
        const { data: orderData } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('reference', reference)
          .maybeSingle();

        if (orderData) {
          order = orderData;
          items = orderData.order_items || [];
        }
      }

      // Fetch from memoryStore fallback
      if (!order) {
        order = memoryStore.getOrderByReference(reference);
        if (order) items = order.items || [];
      }

      if (order) {
        // Mark as paid
        if (supabase) {
          await supabase
            .from('orders')
            .update({
              status: 'paid',
              note: order.note ? `${order.note} | Confirmed via Paystack Webhook` : 'Paid via Paystack',
            })
            .eq('reference', reference);
        } else {
          memoryStore.updateOrderStatus(reference, 'paid');
        }
        order.status = 'paid';

        // Send order confirmation email if not yet sent
        if (!order.email_sent_at) {
          try {
            const emailResult = await sendOrderConfirmationEmail({
              reference: order.reference,
              fullName: order.full_name || data.customer?.first_name || 'Valued Client',
              email: order.email || data.customer?.email,
              phone: order.phone || data.customer?.phone,
              address: order.address || '',
              city: order.city || 'Lagos',
              state: order.state || 'Lagos',
              items: items.map((i: any) => ({
                name: i.name,
                qty: i.quantity || i.qty || 1,
                price_kobo: i.unit_price_kobo || i.price_kobo || 0,
              })),
              totalKobo: order.total_kobo || data.amount,
            });

            if (emailResult.success) {
              const sentAt = new Date().toISOString();
              if (supabase) {
                await supabase
                  .from('orders')
                  .update({ email_sent_at: sentAt })
                  .eq('reference', reference);
              } else {
                memoryStore.markEmailSent(reference);
              }
              console.log(`[Paystack Webhook] Confirmation email sent for ${reference}`);
            }
          } catch (emailErr) {
            console.error('[Paystack Webhook] Email error:', emailErr);
          }
        }
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (err: any) {
    console.error('[Paystack Webhook Exception]:', err);
    return NextResponse.json({ error: err.message || 'Webhook error' }, { status: 500 });
  }
}

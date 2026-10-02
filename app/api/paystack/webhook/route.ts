// Aroma Deluz — Paystack Webhook Handler
// POST /api/paystack/webhook
// Receives charge.success events, verifies signature, marks order paid, and triggers confirmation email

import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { memoryStore } from '@/lib/store';
import { verifyPaystackWebhookSignature } from '@/lib/paystack';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!verifyPaystackWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid Paystack signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const data = payload.data;

    if (event === 'charge.success') {
      const reference = data.reference;
      const amountPaidKobo = data.amount;

      const supabase = createServiceRoleClient() || (await createServerSupabaseClient());

      let order: any = null;
      let items: any[] = [];

      if (supabase) {
        const { data: dbOrder } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('reference', reference)
          .maybeSingle();

        if (dbOrder) {
          order = dbOrder;
          items = dbOrder.order_items || [];
        }
      }

      if (!order) {
        order = memoryStore.getOrderByReference(reference);
        if (order) items = order.items || [];
      }

      if (order && amountPaidKobo >= order.total_kobo) {
        // Mark as paid
        if (supabase) {
          await supabase
            .from('orders')
            .update({ status: 'paid' })
            .eq('reference', reference);
        } else {
          memoryStore.updateOrderStatus(reference, 'paid');
        }

        // Send email if not already sent
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

            if (supabase) {
              await supabase
                .from('orders')
                .update({ email_sent_at: new Date().toISOString() })
                .eq('reference', reference);
            } else {
              memoryStore.markEmailSent(reference);
            }
          } catch (emailErr) {
            console.error('[Paystack Webhook Mailgun Error]:', emailErr);
          }
        }
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error: any) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json({ error: error.message || 'Webhook failed' }, { status: 500 });
  }
}

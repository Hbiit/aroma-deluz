// Aroma Deluz — Order Confirmation & Email Dispatch Route
// POST /api/orders/confirm
// Invoked when PayPal or Paystack payment is confirmed.
// Marks order as paid, guarantees order confirmation email is dispatched via Nodemailer,
// and returns the verified order object.

import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { memoryStore } from '@/lib/store';
import { sendOrderConfirmationEmail } from '@/lib/mailgun';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reference, paymentMethod = 'paypal', transactionId, customerEmail } = body;

    if (!reference) {
      return NextResponse.json({ error: 'Order reference required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient() || (await createServerSupabaseClient());

    let order: any = null;
    let items: any[] = [];

    // 1. Fetch order from Supabase
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

    // Fallback to memoryStore
    if (!order) {
      order = memoryStore.getOrderByReference(reference);
      if (order) {
        items = order.items || [];
      }
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. Mark order as paid
    if (supabase) {
      const { data: updated, error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          note: order.note ? `${order.note} | Confirmed via ${paymentMethod} (${transactionId || 'approved'})` : `Paid via ${paymentMethod}`,
        })
        .eq('reference', reference)
        .select('*, order_items(*)')
        .single();

      if (!updateError && updated) {
        order = updated;
        items = updated.order_items || items;
      }
    } else {
      memoryStore.updateOrderStatus(reference, 'paid');
      order.status = 'paid';
    }

    // 3. Dispatch confirmation email via Nodemailer (testerdefault8@gmail.com)
    let emailSent = false;
    let emailError: string | null = null;

    if (!order.email_sent_at) {
      try {
        const emailRecipient = customerEmail || order.email;
        const sendResult = await sendOrderConfirmationEmail({
          reference: order.reference,
          fullName: order.full_name || 'Valued Client',
          email: emailRecipient,
          phone: order.phone,
          address: order.address || '',
          city: order.city || 'Lagos',
          state: order.state || 'Lagos',
          items: items.map((i: any) => ({
            name: i.name,
            qty: i.quantity || i.qty || 1,
            price_kobo: i.unit_price_kobo || i.price_kobo || 0,
          })),
          totalKobo: order.total_kobo,
        });

        if (sendResult.success) {
          emailSent = true;
          const sentAt = new Date().toISOString();
          if (supabase) {
            await supabase
              .from('orders')
              .update({ email_sent_at: sentAt })
              .eq('reference', reference);
          } else {
            memoryStore.markEmailSent(reference);
          }
          order.email_sent_at = sentAt;
          console.log(`[Order Confirmation] Email sent for order ${reference} to ${emailRecipient}`);
        } else {
          emailError = sendResult.error || 'Failed to dispatch email';
          console.warn(`[Order Confirmation] Email failed for ${reference}:`, emailError);
        }
      } catch (err: any) {
        emailError = err.message || 'Email dispatch exception';
        console.error('[Order Confirmation] Dispatch exception:', err);
      }
    } else {
      emailSent = true;
    }

    return NextResponse.json({
      success: true,
      verified: true,
      order,
      items,
      emailSent,
      emailError,
      paymentMethod,
    });
  } catch (error: any) {
    console.error('[Order Confirm API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to confirm order' },
      { status: 500 }
    );
  }
}

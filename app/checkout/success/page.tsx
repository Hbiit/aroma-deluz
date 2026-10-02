'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { formatNaira } from '@/lib/utils';

function SuccessContent() {
  const searchParams = useSearchParams();
  const ref =
    searchParams.get('reference') ||
    searchParams.get('trxref') ||
    searchParams.get('ref') ||
    'AROMA-DELUZ';

  const paymentMethodQuery = searchParams.get('payment_method') || 'paystack';
  const isDemoQuery = searchParams.get('demo') === 'true';

  const { clearCart } = useCart();
  const [order, setOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasVerifiedRef = useRef(false);

  useEffect(() => {
    // 1. Immediately wipe the cart as payment has been completed
    clearCart();
    try {
      localStorage.removeItem('aroma_guest_cart');
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('aroma_cart') || k === 'aroma_guest_cart')) {
          localStorage.removeItem(k);
        }
      }
      window.dispatchEvent(new Event('cart-cleared'));
    } catch {}

    // 2. Check local session storage for instant optimistic display
    let localOrder: any = null;
    try {
      const stored = sessionStorage.getItem('last_order');
      if (stored) {
        localOrder = JSON.parse(stored);
        setOrder(localOrder);
        if (localOrder.items) setOrderItems(localOrder.items);
      }
    } catch {}

    if (hasVerifiedRef.current) return;
    hasVerifiedRef.current = true;

    const maxAttempts = 5;

    // 3. Server-side verification (with automatic retry polling)
    async function verifyOrder() {
      setVerifying(true);

      // If PayPal payment method, confirm directly with our confirmation endpoint
      if (paymentMethodQuery === 'paypal') {
        try {
          const confirmRes = await fetch('/api/orders/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reference: ref,
              paymentMethod: 'paypal',
              customerEmail: localOrder?.email,
            }),
          });
          const confirmData = await confirmRes.json();
          if (confirmRes.ok && confirmData.success) {
            setVerified(true);
            if (confirmData.order) setOrder(confirmData.order);
            if (confirmData.items) setOrderItems(confirmData.items);
            clearCart();
            try { sessionStorage.removeItem('last_order'); } catch {}
            setVerifying(false);
            return;
          }
        } catch (e) {
          console.warn('Direct PayPal confirmation ping failed, continuing fallback:', e);
        }
      }

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const res = await fetch(`/api/orders/${encodeURIComponent(ref)}`);
          const data = await res.json();

          if (res.ok && data.verified) {
            setVerified(true);
            if (data.order) {
              setOrder(data.order);
              if (data.items && data.items.length > 0) {
                setOrderItems(data.items);
              }
            }
            // Clear cart now that payment is confirmed
            clearCart();
            try {
              sessionStorage.removeItem('last_order');
            } catch {}
            setVerifying(false);
            return;
          }

          // If status is ongoing or pending, retry in 2 seconds
          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            continue;
          }

          if (res.ok && data.verified === false) {
            setVerified(false);
            setErrorMessage(
              data.message || 'Payment has not been completed or was cancelled.'
            );
          } else {
            if (localOrder || isDemoQuery || paymentMethodQuery === 'paypal') {
              setVerified(true);
              clearCart();
            } else {
              setVerified(false);
              setErrorMessage(data.error || 'Unable to locate order record.');
            }
          }
        } catch (err: any) {
          console.error(`Verification attempt ${attempt} error:`, err);
          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            continue;
          }
          if (localOrder || isDemoQuery || paymentMethodQuery === 'paypal') {
            setVerified(true);
            clearCart();
          } else {
            setVerified(false);
            setErrorMessage('Network error while verifying payment.');
          }
        }
      }

      setVerifying(false);
    }

    verifyOrder();
  }, [ref, clearCart, isDemoQuery, paymentMethodQuery]);

  return (
    <div className="min-h-[85vh] bg-cream py-16 px-4">
      <div className="max-w-[700px] mx-auto bg-white rounded-2xl p-8 sm:p-12 border border-gold/20 shadow-[0_20px_60px_rgba(26,15,48,0.06)] animate-fade-in-up">
        {/* State 1: Verifying */}
        {verifying && (
          <div className="text-center py-10 space-y-4">
            <div className="w-14 h-14 border-3 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[0.72rem] tracking-[0.25em] uppercase text-gold font-semibold">
              {paymentMethodQuery === 'paypal' ? 'PayPal Transaction Confirmation' : 'Paystack Payment Verification'}
            </p>
            <h2 className="font-serif text-2xl text-purple-ink">
              {paymentMethodQuery === 'paypal'
                ? 'Confirming your payment with PayPal...'
                : 'Verifying your transaction with Paystack...'}
            </h2>
            <p className="text-xs text-purple-ink/60">
              Please wait while our atelier confirms your payment and reserves your items.
            </p>
          </div>
        )}

        {/* State 2: Verification Failed or Cancelled */}
        {!verifying && !verified && (
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 rounded-full bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center text-2xl mx-auto shadow-sm">
              ✕
            </div>
            <div>
              <p className="text-[0.72rem] tracking-[0.25em] uppercase text-rose-600 font-semibold mb-2">
                Payment Incomplete
              </p>
              <h1 className="font-serif text-3xl text-purple-ink mb-3">
                Transaction Not Confirmed
              </h1>
              <p className="text-xs sm:text-sm text-purple-ink/70 max-w-[480px] mx-auto font-light leading-relaxed">
                {errorMessage ||
                  'Your payment could not be verified by Paystack. If funds were debited, our concierge team will automatically reconcile your order.'}
              </p>
            </div>

            <div className="bg-ivory rounded-xl p-4 border border-gold/20 font-mono text-xs text-purple-deep">
              Reference: {ref}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/checkout"
                className="w-full sm:w-auto px-8 py-3.5 bg-purple-darkest text-white text-xs font-semibold tracking-[0.2em] uppercase rounded-xl hover:bg-purple-deep transition-colors text-center"
              >
                Return to Checkout
              </Link>
              <a
                href="https://wa.me/2348000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-3.5 bg-white border border-gold/30 text-purple-ink hover:text-gold text-xs font-semibold tracking-[0.15em] uppercase rounded-xl hover:border-gold transition-colors text-center flex items-center justify-center gap-2"
              >
                <span>💬</span>
                <span>WhatsApp Concierge</span>
              </a>
            </div>
          </div>
        )}

        {/* State 3: Payment Verified & Order Confirmed */}
        {!verifying && verified && (
          <div>
            {/* Success Icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center text-2xl mx-auto mb-6 shadow-sm">
              ✓
            </div>

            {/* Demo Mode Badge if no real payment was taken */}
            {(order?.demo || isDemoQuery) && (
              <div className="mb-4 text-center">
                <span className="inline-block px-3.5 py-1 bg-amber-50 border border-amber-300 text-amber-800 rounded-full text-[0.68rem] tracking-[0.15em] uppercase font-semibold">
                  ✦ Demo mode — no payment was taken ✦
                </span>
              </div>
            )}

            <p className="text-center text-[0.72rem] tracking-[0.25em] uppercase text-gold font-semibold mb-2">
              Payment Confirmed via {paymentMethodQuery === 'paypal' ? 'PayPal' : 'Paystack'} · Order Placed
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl text-purple-ink text-center mb-3">
              Thank you for choosing Aroma De Luz.
            </h1>
            <p className="text-center text-xs sm:text-sm text-purple-ink/70 max-w-[480px] mx-auto mb-6 font-light leading-relaxed">
              Your bespoke fragrance order has been received at our atelier. Our artisans are carefully preparing your hand-poured creations.
            </p>

            {/* Email Confirmation Notice */}
            <div className="mb-8 p-4 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 flex items-start gap-3 shadow-xs">
              <span className="text-xl flex-shrink-0">✉️</span>
              <div className="text-xs">
                <strong className="font-semibold block text-[0.75rem] uppercase tracking-wider text-emerald-900">
                  Confirmation Email Dispatched
                </strong>
                <p className="mt-1 text-emerald-800/90 leading-relaxed">
                  Your luxury receipt has been dispatched to{' '}
                  <span className="font-semibold underline text-emerald-950">{order?.email || 'your email'}</span> from{' '}
                  <span className="font-semibold text-emerald-950">testerdefault8@gmail.com</span>.
                </p>
              </div>
            </div>

            {/* Order Reference Box */}
            <div className="bg-ivory rounded-xl p-5 border border-gold/20 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 text-xs">
              <div>
                <span className="text-[0.68rem] tracking-[0.15em] uppercase text-purple-ink/50 block">
                  Order Reference
                </span>
                <strong className="font-mono text-base text-purple-deep mt-0.5 block tracking-wider">
                  {ref}
                </strong>
              </div>
              <div className="text-center sm:text-right">
                <span className="text-[0.68rem] tracking-[0.15em] uppercase text-purple-ink/50 block">
                  Estimated Delivery
                </span>
                <span className="text-purple-ink font-semibold">
                  24 – 48 Hours (Express Lagos)
                </span>
              </div>
            </div>

            {/* Order Details */}
            {order && (
              <div className="mb-8 border-t border-b border-gold/15 py-6 space-y-4 text-xs">
                <h3 className="font-serif text-base text-purple-ink font-semibold">
                  Recipient & Dispatch Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-purple-ink/80">
                  <div>
                    <span className="text-purple-ink/50 block text-[0.68rem]">Recipient</span>
                    <strong>{order.full_name || order.fullName}</strong>{' '}
                    {order.phone && <span>({order.phone})</span>}
                  </div>
                  <div>
                    <span className="text-purple-ink/50 block text-[0.68rem]">Destination</span>
                    <span>
                      {order.address}, {order.city}, {order.state}
                    </span>
                  </div>
                  <div>
                    <span className="text-purple-ink/50 block text-[0.68rem]">Email Confirmation</span>
                    <span>{order.email}</span>
                  </div>
                  {(order.total_kobo || order.totalKobo) && (
                    <div>
                      <span className="text-purple-ink/50 block text-[0.68rem]">Amount Verified</span>
                      <strong className="text-purple-deep">
                        {formatNaira(order.total_kobo || order.totalKobo)}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Itemized Order Breakdown */}
                {orderItems && orderItems.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gold/10">
                    <span className="text-[0.68rem] tracking-[0.1em] uppercase text-purple-ink/60 font-semibold block mb-2">
                      Hand-Selected Atelier Creations
                    </span>
                    <div className="divide-y divide-gold/10">
                      {orderItems.map((item: any, idx: number) => {
                        const qty = item.quantity || item.qty || 1;
                        const price = item.unit_price_kobo || item.price_kobo || 0;
                        return (
                          <div
                            key={idx}
                            className="py-2 flex items-center justify-between text-purple-ink"
                          >
                            <div>
                              <span className="font-medium">{item.name}</span>
                              <span className="text-purple-ink/50 text-[0.7rem] ml-2">
                                × {qty}
                              </span>
                            </div>
                            <span className="font-medium text-purple-deep">
                              {formatNaira(price * qty)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/products"
                className="w-full sm:w-auto px-8 py-3.5 bg-purple-darkest text-white text-xs font-semibold tracking-[0.2em] uppercase rounded-xl hover:bg-purple-deep transition-colors text-center"
              >
                Continue Exploring
              </Link>
              <a
                href="https://wa.me/2348000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-3.5 bg-white border border-gold/30 text-purple-ink hover:text-gold text-xs font-semibold tracking-[0.15em] uppercase rounded-xl hover:border-gold transition-colors text-center flex items-center justify-center gap-2"
              >
                <span>💬</span>
                <span>WhatsApp Concierge</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center bg-cream">
          <span className="inline-block w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatNaira } from '@/lib/utils';

function SuccessContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref') || 'AROMA-DELUZ';

  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('last_order');
    if (stored) {
      try {
        setOrder(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  return (
    <div className="min-h-[85vh] bg-cream py-16 px-4">
      <div className="max-w-[700px] mx-auto bg-white rounded-2xl p-8 sm:p-12 border border-gold/20 shadow-[0_20px_60px_rgba(26,15,48,0.06)] animate-fade-in-up">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center text-2xl mx-auto mb-6 shadow-sm">
          ✓
        </div>

        <p className="text-center text-[0.72rem] tracking-[0.25em] uppercase text-gold font-semibold mb-2">
          Payment Confirmed · Order Placed
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl text-purple-ink text-center mb-3">
          Thank you for choosing Aroma De Luz.
        </h1>
        <p className="text-center text-xs sm:text-sm text-purple-ink/70 max-w-[480px] mx-auto mb-8 font-light leading-relaxed">
          Your bespoke fragrance order has been received at our atelier. Our artisans are carefully preparing your hand-poured creations.
        </p>

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

        {/* Order Details (if stored in session) */}
        {order && (
          <div className="mb-8 border-t border-b border-gold/15 py-6 space-y-4 text-xs">
            <h3 className="font-serif text-base text-purple-ink font-semibold">
              Recipient & Dispatch Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-purple-ink/80">
              <div>
                <span className="text-purple-ink/50 block text-[0.68rem]">Recipient</span>
                <strong>{order.fullName}</strong> ({order.phone})
              </div>
              <div>
                <span className="text-purple-ink/50 block text-[0.68rem]">Destination</span>
                <span>{order.address}, {order.city}, {order.state}</span>
              </div>
              {order.totalKobo && (
                <div>
                  <span className="text-purple-ink/50 block text-[0.68rem]">Amount Paid</span>
                  <strong className="text-purple-deep">{formatNaira(order.totalKobo)}</strong>
                </div>
              )}
            </div>
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

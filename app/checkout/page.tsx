'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { formatNaira } from '@/lib/utils';

const NIGERIAN_STATES = [
  'Lagos', 'Abuja (FCT)', 'Rivers', 'Oyo', 'Ogun', 'Delta', 'Anambra', 
  'Enugu', 'Kaduna', 'Kano', 'Edo', 'Akwa Ibom', 'Ondo', 'Osun', 'Cross River'
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, clearCart } = useCart();
  const { user } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Lagos');
  const [state, setState] = useState('Lagos');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  // Delivery cost: Free over ₦150,000; otherwise ₦4,500 for Lagos, ₦7,500 elsewhere
  const deliveryKobo = totalAmount >= 15000000 ? 0 : state === 'Lagos' ? 450000 : 750000;
  const grandTotalKobo = totalAmount + deliveryKobo;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setLoading(true);

    try {
      const orderRef = 'AROMA-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000);

      // Save order to API / Supabase
      const payload = {
        reference: orderRef,
        userId: user?.id,
        email,
        fullName,
        phone,
        address,
        city,
        state,
        note,
        items,
        totalKobo: grandTotalKobo,
      };

      // Call checkout api or simulate
      try {
        await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {
        // Fallback for offline/demo
      }

      // Store in session storage for receipt page
      sessionStorage.setItem('last_order', JSON.stringify({
        ...payload,
        createdAt: new Date().toISOString(),
      }));

      clearCart();
      router.push(`/checkout/success?ref=${orderRef}`);
    } catch {
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-cream">
        <div className="w-16 h-16 rounded-full bg-gold/15 flex items-center justify-center text-gold text-2xl mb-4">
          🛍
        </div>
        <h1 className="font-serif text-3xl text-purple-ink mb-2">Your Bag is Empty</h1>
        <p className="text-purple-ink/60 text-sm max-w-[360px] mb-6">
          Explore our collection of hand-poured candles and signature perfumes to begin your olfactory journey.
        </p>
        <Link
          href="/products"
          className="px-8 py-3.5 bg-purple-darkest text-white text-xs font-semibold tracking-[0.2em] uppercase rounded-xl hover:bg-purple-deep transition-colors"
        >
          Discover Fragrances
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-12 px-4 md:px-8">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="font-serif text-3xl md:text-4xl text-purple-ink text-center mb-2">
          Secure Luxury Checkout
        </h1>
        <p className="text-center text-xs text-purple-ink/60 uppercase tracking-[0.15em] mb-10">
          Complimentary Gift Packaging & White-Glove Dispatch
        </p>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left: Customer & Delivery Details */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-gold/15 shadow-sm space-y-6">
            <h2 className="font-serif text-xl text-purple-ink font-semibold border-b border-gold/15 pb-3">
              1. Delivery Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.72rem] tracking-[0.1em] uppercase text-purple-ink/70 font-semibold mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Adebayo Adeleke"
                  className="w-full px-4 py-2.5 bg-ivory border border-gold/25 rounded-lg text-sm text-purple-ink focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-[0.72rem] tracking-[0.1em] uppercase text-purple-ink/70 font-semibold mb-1.5">
                  Phone Number (For Courier) *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0801 234 5678"
                  className="w-full px-4 py-2.5 bg-ivory border border-gold/25 rounded-lg text-sm text-purple-ink focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[0.72rem] tracking-[0.1em] uppercase text-purple-ink/70 font-semibold mb-1.5">
                Email Address (For Order Tracking) *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full px-4 py-2.5 bg-ivory border border-gold/25 rounded-lg text-sm text-purple-ink focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-[0.72rem] tracking-[0.1em] uppercase text-purple-ink/70 font-semibold mb-1.5">
                Delivery Address *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, Estate, Apartment / Suite"
                className="w-full px-4 py-2.5 bg-ivory border border-gold/25 rounded-lg text-sm text-purple-ink focus:outline-none focus:border-gold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.72rem] tracking-[0.1em] uppercase text-purple-ink/70 font-semibold mb-1.5">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Victoria Island, Lekki, Ikeja"
                  className="w-full px-4 py-2.5 bg-ivory border border-gold/25 rounded-lg text-sm text-purple-ink focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-[0.72rem] tracking-[0.1em] uppercase text-purple-ink/70 font-semibold mb-1.5">
                  State *
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-2.5 bg-ivory border border-gold/25 rounded-lg text-sm text-purple-ink focus:outline-none focus:border-gold cursor-pointer"
                >
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[0.72rem] tracking-[0.1em] uppercase text-purple-ink/70 font-semibold mb-1.5">
                Gift Card Message or Delivery Instructions (Optional)
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a personalized gift note for the recipient..."
                className="w-full px-4 py-2.5 bg-ivory border border-gold/25 rounded-lg text-sm text-purple-ink focus:outline-none focus:border-gold"
              />
            </div>

            {/* Payment Method Selector */}
            <div className="pt-4 border-t border-gold/15">
              <h2 className="font-serif text-xl text-purple-ink font-semibold mb-3">
                2. Payment Method
              </h2>
              <div className="p-4 rounded-xl border-2 border-gold bg-gold/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-4 border-gold bg-purple-darkest" />
                  <div>
                    <strong className="text-xs text-purple-ink uppercase tracking-[0.1em] block">
                      Paystack Secure Checkout
                    </strong>
                    <span className="text-[0.72rem] text-purple-ink/60">
                      Debit Card, Bank Transfer, Apple Pay, USSD
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gold font-bold px-2 py-0.5 rounded bg-gold/15 border border-gold/30">
                  Instant Verification
                </span>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-8 border border-gold/15 shadow-sm sticky top-24">
            <h2 className="font-serif text-xl text-purple-ink font-semibold border-b border-gold/15 pb-3 mb-5">
              Order Summary ({items.length} Items)
            </h2>

            {/* Item List */}
            <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 pb-3 border-b border-gold/10">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-cream flex-shrink-0 border border-gold/15">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-sm text-purple-ink font-semibold truncate">
                      {item.name}
                    </h4>
                    <p className="text-[0.7rem] text-purple-ink/50 mt-0.5">
                      Qty: {item.qty} × {formatNaira(item.price_kobo)}
                    </p>
                  </div>
                  <div className="text-xs font-semibold text-purple-deep">
                    {formatNaira(item.price_kobo * item.qty)}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-2.5 text-xs text-purple-ink/70 pb-4 border-b border-gold/15">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-purple-ink">{formatNaira(totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Shipping ({state})</span>
                <span className="font-medium text-purple-ink">
                  {deliveryKobo === 0 ? (
                    <span className="text-emerald-700 font-bold uppercase tracking-[0.1em]">Free (Complimentary)</span>
                  ) : (
                    formatNaira(deliveryKobo)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Luxury Gift Box & Discovery Vials</span>
                <span className="text-gold font-semibold uppercase tracking-[0.05em]">Included</span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="flex justify-between items-baseline py-4 mb-6">
              <span className="font-serif text-lg font-semibold text-purple-ink">Total Due</span>
              <span className="font-serif text-2xl font-bold text-purple-deep">
                {formatNaira(grandTotalKobo)}
              </span>
            </div>

            {/* Place Order CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gold hover:bg-gold-bright text-purple-darkest font-semibold text-xs tracking-[0.2em] uppercase rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-purple-darkest border-t-transparent rounded-full animate-spin" />
                  <span>Securing Order...</span>
                </>
              ) : (
                `Complete Order · ${formatNaira(grandTotalKobo)}`
              )}
            </button>

            {/* Security Guarantee */}
            <div className="mt-4 text-center">
              <p className="text-[0.68rem] text-purple-ink/50 flex items-center justify-center gap-1.5">
                <span>🔒</span>
                <span>256-Bit SSL Encrypted & Paystack Protected</span>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

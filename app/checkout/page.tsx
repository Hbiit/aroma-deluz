'use client';

import { useState, useEffect } from 'react';
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
  const { user, loading: authLoading } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || 'Lagos');
  const [state, setState] = useState(user?.state || 'Lagos');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'demo' | 'paystack' | 'paypal'>('demo');
  const [paypalModalOpen, setPaypalModalOpen] = useState(false);
  const [paypalProcessing, setPaypalProcessing] = useState(false);
  const [currentOrderRef, setCurrentOrderRef] = useState<string | null>(null);

  // Sync user details if user loads after mount
  useEffect(() => {
    if (user) {
      if (!fullName && user.fullName) setFullName(user.fullName);
      if (!email && user.email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
      if (!address && user.address) setAddress(user.address);
      if (user.city) setCity(user.city);
      if (user.state) setState(user.state);
    }
  }, [user]);

  // Delivery cost: Free over ₦150,000; otherwise ₦4,500 for Lagos, ₦7,500 elsewhere
  const deliveryKobo = totalAmount >= 15000000 ? 0 : state === 'Lagos' ? 450000 : 750000;
  const grandTotalKobo = totalAmount + deliveryKobo;
  const grandTotalUSD = ((grandTotalKobo / 100) / 1550).toFixed(2);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const orderRef = 'AROMA-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000);
      setCurrentOrderRef(orderRef);

      // Save order to API / Supabase in Demo Mode
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
        paymentMethod: 'demo',
        isDemo: true,
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to initialize order');
      }

      // Store in session storage for receipt page fallback
      sessionStorage.setItem('last_order', JSON.stringify({
        ...payload,
        createdAt: new Date().toISOString(),
      }));

      // In Demo Mode: Immediately clear cart and transition to confirmation
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

      router.push(`/checkout/success?ref=${orderRef}&demo=true`);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'Payment initialization failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Process PayPal Confirmation & Email Dispatch
  const handleConfirmPayPalPayment = async () => {
    if (!currentOrderRef) return;
    setPaypalProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/orders/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: currentOrderRef,
          paymentMethod: 'paypal',
          transactionId: 'PAYPAL-' + Date.now().toString(36).toUpperCase(),
          customerEmail: email,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'PayPal confirmation failed');
      }

      // Clear cart completely
      clearCart();
      try {
        localStorage.removeItem('aroma_guest_cart');
        window.dispatchEvent(new Event('cart-cleared'));
      } catch {}

      // Move directly to the confirmation success page
      router.push(`/checkout/success?ref=${currentOrderRef}&payment_method=paypal`);
    } catch (err: any) {
      console.error('PayPal confirmation error:', err);
      setErrorMessage(err.message || 'Failed to confirm PayPal transaction.');
      setPaypalProcessing(false);
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center bg-cream">
        <div className="w-16 h-16 rounded-full bg-gold/15 flex items-center justify-center text-gold text-2xl mb-4 border border-gold/30">
          ✦
        </div>
        <span className="text-[0.7rem] uppercase tracking-[0.2em] text-gold font-semibold mb-2">
          Private Atelier Checkout
        </span>
        <h1 className="font-serif text-3xl md:text-4xl text-purple-ink mb-3">
          Sign In to Complete Your Order
        </h1>
        <p className="text-purple-ink/70 text-sm max-w-[420px] mb-8 leading-relaxed">
          To ensure your items are reserved, access complimentary gift packaging, and complete your delivery, please sign in or register your account.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[360px]">
          <Link
            href="/auth?redirect=/checkout"
            className="flex-1 py-3.5 px-6 bg-gold hover:bg-gold-bright text-purple-darkest text-xs font-semibold tracking-[0.2em] uppercase rounded-xl transition-all shadow-md text-center"
          >
            Sign In / Register
          </Link>
          <Link
            href="/products"
            className="py-3.5 px-6 bg-transparent border border-purple-ink/20 text-purple-ink text-xs font-semibold tracking-[0.1em] uppercase rounded-xl hover:border-gold hover:text-gold transition-colors text-center"
          >
            Browse Scents
          </Link>
        </div>
      </div>
    );
  }

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

            {/* Payment Method Selector — Demo Atelier Mode */}
            <div className="pt-4 border-t border-gold/15">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-serif text-xl text-purple-ink font-semibold">
                  2. Payment Method
                </h2>
                <span className="text-[0.65rem] uppercase tracking-[0.15em] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-900 border border-amber-500/30">
                  Demo Mode Active
                </span>
              </div>

              {/* Demo Payment Option Card */}
              <div className="p-4 sm:p-5 rounded-xl border-2 border-gold bg-gold/10 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full border-2 border-gold bg-purple-darkest flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-gold" />
                    </div>
                    <strong className="text-xs sm:text-sm text-purple-ink uppercase tracking-[0.08em] font-semibold">
                      Demo Atelier Checkout (Instant Verification)
                    </strong>
                  </div>
                  <span className="text-[0.62rem] text-gold font-bold px-2.5 py-0.5 rounded bg-gold/20 border border-gold/40 uppercase tracking-wider">
                    Zero Charge
                  </span>
                </div>
                <p className="text-[0.72rem] text-purple-ink/75 leading-relaxed pl-7.5">
                  Live payment gateways (Paystack & PayPal) are temporarily paused. Your order will be placed instantly in Demo Mode, reserved in our system at no charge, and an official order confirmation receipt will be emailed directly to <strong className="text-purple-ink">{email || 'your email'}</strong>.
                </p>
                <div className="pl-7.5 pt-1 flex items-center gap-2 text-[0.68rem] text-emerald-800 font-medium">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Instant luxury reservation & automated confirmation receipt</span>
                </div>
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
                      src={item.image_url || '/product-lamour.jpg'}
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
              <div className="text-right">
                <span className="font-serif text-2xl font-bold text-purple-deep block">
                  {formatNaira(grandTotalKobo)}
                </span>
                <span className="text-[0.72rem] text-amber-800 font-medium">
                  ✦ Demo Order (No Charge) ✦
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2 animate-fade-in">
                <span className="font-bold text-rose-600">✕</span>
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Place Order CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 font-semibold text-xs tracking-[0.2em] uppercase rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 bg-gold hover:bg-gold-bright text-purple-darkest"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Securing Demo Order...</span>
                </>
              ) : (
                `Complete Demo Order · ${formatNaira(grandTotalKobo)}`
              )}
            </button>

            {/* Security Guarantee */}
            <div className="mt-4 text-center">
              <p className="text-[0.68rem] text-purple-ink/60 flex items-center justify-center gap-1.5">
                <span>🔒</span>
                <span>Demo Payment Mode Active · Zero charges billed · Instant Email Confirmation</span>
              </p>
            </div>
          </div>
        </form>
      </div>

      {/* PayPal Interactive Confirmation Modal */}
      {paypalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-[460px] w-full p-6 sm:p-8 shadow-2xl border border-blue-100 space-y-5 animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
                  P
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">PayPal Checkout</h3>
                  <p className="text-[0.68rem] text-gray-500">Aroma De Luz Luxury Fragrances</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaypalModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg p-1"
                disabled={paypalProcessing}
              >
                ✕
              </button>
            </div>

            {/* Order Details */}
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/80 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Order Reference:</span>
                <span className="font-mono font-medium text-gray-900">{currentOrderRef}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Recipient:</span>
                <span className="font-medium text-gray-900">{fullName}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Confirmation Email:</span>
                <span className="font-medium text-gray-900">{email}</span>
              </div>
              <div className="flex justify-between text-gray-600 pt-2 border-t border-blue-100">
                <span>Total Amount:</span>
                <div className="text-right">
                  <span className="font-bold text-gray-900 block">{formatNaira(grandTotalKobo)}</span>
                  <span className="text-[0.68rem] text-blue-700 font-semibold">${grandTotalUSD} USD</span>
                </div>
              </div>
            </div>

            <p className="text-[0.72rem] text-gray-600 leading-relaxed text-center">
              Click below to complete and confirm your payment with PayPal. Once confirmed, you will be taken to your order confirmation page and an email receipt will be sent to <strong>{email}</strong>.
            </p>

            {/* Confirm CTA */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleConfirmPayPalPayment}
                disabled={paypalProcessing}
                className="w-full py-3.5 px-6 bg-[#FFC439] hover:bg-[#f4bb34] text-blue-950 font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {paypalProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-blue-950 border-t-transparent rounded-full animate-spin" />
                    <span>Confirming with PayPal & Sending Email...</span>
                  </>
                ) : (
                  <span>Approve & Complete with PayPal</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setPaypalModalOpen(false)}
                disabled={paypalProcessing}
                className="w-full py-2.5 text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Cancel and Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

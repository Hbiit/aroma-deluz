'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { formatNaira } from '@/lib/utils';

const NIGERIAN_STATES = [
  'Lagos', 'Abuja (FCT)', 'Rivers', 'Oyo', 'Ogun', 'Delta', 'Anambra',
  'Enugu', 'Kaduna', 'Kano', 'Edo', 'Akwa Ibom', 'Ondo', 'Osun', 'Cross River'
];

interface OrderItem {
  id: string;
  name: string;
  unit_price_kobo: number;
  quantity: number;
}

interface OrderRecord {
  id: string;
  reference: string;
  total_kobo: number;
  status: string;
  created_at: string;
  address?: string;
  city?: string;
  state?: string;
  order_items?: OrderItem[];
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, updateProfile, signOut, isDemo } = useAuth();
  const { items, totalItems, totalFormatted } = useCart();

  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'loyalty'>('info');

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Lagos');
  const [state, setState] = useState('Lagos');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Orders states
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Sync user data to form
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setCity(user.city || 'Lagos');
      setState(user.state || 'Lagos');
    }
  }, [user]);

  // Redirect unauthenticated guests to login
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth?redirect=/profile');
    }
  }, [authLoading, user, router]);

  // Fetch past orders
  useEffect(() => {
    if (!user) return;
    setLoadingOrders(true);

    const query = new URLSearchParams();
    if (user.id) query.set('userId', user.id);
    if (user.email) query.set('email', user.email);

    fetch(`/api/user/orders?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) {
          setOrders(data.orders);
        }
      })
      .catch((err) => console.error('Failed to load orders:', err))
      .finally(() => setLoadingOrders(false));
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const res = await updateProfile({
        fullName,
        phone,
        address,
        city,
        state,
      });

      if (res?.error) {
        setSaveError(res.error);
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update profile information.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-cream">
        <span className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs uppercase tracking-[0.2em] text-purple-ink/60 font-semibold">
          Loading Your Atelier Sanctuary...
        </p>
      </div>
    );
  }

  const initials = fullName
    ? fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-cream py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1100px] mx-auto">
        {/* Header Profile Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gold/20 shadow-[0_15px_45px_rgba(26,15,48,0.05)] mb-8 animate-fade-in-up">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 pb-8 border-b border-gold/15">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              {/* Avatar */}
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-purple-darkest via-purple-deep to-gold p-1 shadow-md">
                <div className="w-full h-full rounded-full bg-purple-darkest flex items-center justify-center text-gold font-serif text-3xl font-bold tracking-wider">
                  {initials}
                </div>
                <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full" title="Active Connoisseur" />
              </div>

              <div>
                <span className="text-[0.68rem] tracking-[0.2em] uppercase text-gold font-bold block mb-1">
                  Private Atelier Connoisseur
                </span>
                <h1 className="font-serif text-2xl sm:text-3xl text-purple-ink font-semibold">
                  {fullName || 'Valued Connoisseur'}
                </h1>
                <p className="text-purple-ink/60 text-xs sm:text-sm mt-0.5">{email}</p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                  <span className="px-3 py-1 bg-gold/15 border border-gold/30 text-purple-deep rounded-full text-[0.68rem] tracking-[0.1em] uppercase font-semibold">
                    ✦ VIP Member
                  </span>
                  {phone && (
                    <span className="text-xs text-purple-ink/70 bg-ivory px-3 py-1 rounded-full border border-gold/10">
                      📞 {phone}
                    </span>
                  )}
                  {isDemo && (
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-deep/10 text-purple-deep text-[0.65rem]">
                      Demo Mode
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/products"
                className="px-4 py-2.5 bg-ivory hover:bg-gold/10 border border-gold/30 text-purple-ink hover:text-gold text-xs font-semibold tracking-[0.1em] uppercase rounded-xl transition-colors"
              >
                Explore Scent Atelier
              </Link>
              <button
                onClick={signOut}
                className="px-4 py-2.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold tracking-[0.1em] uppercase rounded-xl transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-center">
            <div className="p-3.5 bg-ivory rounded-2xl border border-gold/10">
              <span className="text-[0.68rem] uppercase tracking-[0.15em] text-purple-ink/50 font-medium block">
                Total Orders
              </span>
              <strong className="font-serif text-2xl text-purple-ink block mt-1">
                {orders.length}
              </strong>
            </div>
            <div className="p-3.5 bg-ivory rounded-2xl border border-gold/10">
              <span className="text-[0.68rem] uppercase tracking-[0.15em] text-purple-ink/50 font-medium block">
                Items In Bag
              </span>
              <strong className="font-serif text-2xl text-gold block mt-1">
                {totalItems}
              </strong>
            </div>
            <div className="p-3.5 bg-ivory rounded-2xl border border-gold/10">
              <span className="text-[0.68rem] uppercase tracking-[0.15em] text-purple-ink/50 font-medium block">
                Delivery Area
              </span>
              <strong className="font-serif text-lg text-purple-ink block mt-1 truncate">
                {state || 'Lagos'}
              </strong>
            </div>
            <div className="p-3.5 bg-ivory rounded-2xl border border-gold/10">
              <span className="text-[0.68rem] uppercase tracking-[0.15em] text-purple-ink/50 font-medium block">
                Privilege Tier
              </span>
              <strong className="font-serif text-base text-purple-deep block mt-1">
                L’Élite Privée
              </strong>
            </div>
          </div>
        </div>

        {/* Active Cart Banner (if user has items waiting) */}
        {totalItems > 0 && (
          <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-purple-darkest via-purple-deep to-purple-darkest text-ivory border border-gold/30 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold text-lg flex-shrink-0">
                🛍
              </div>
              <div>
                <p className="font-serif text-sm sm:text-base font-semibold text-ivory">
                  You have {totalItems} item{totalItems > 1 ? 's' : ''} in your fragrance bag ({totalFormatted})
                </p>
                <p className="text-[0.72rem] text-gold-bright mt-0.5">
                  Complete your order now with complimentary discovery packaging &amp; express dispatch.
                </p>
              </div>
            </div>
            <Link
              href="/checkout"
              className="px-6 py-2.5 bg-gold hover:bg-gold-bright text-purple-darkest text-xs font-semibold tracking-[0.15em] uppercase rounded-xl transition-all shadow whitespace-nowrap"
            >
              Complete Order &bull; Pay
            </Link>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-gold/20 mb-8 space-x-6 sm:space-x-10">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3.5 text-xs sm:text-sm font-semibold tracking-[0.15em] uppercase transition-all relative ${
              activeTab === 'info'
                ? 'text-purple-ink font-bold'
                : 'text-purple-ink/50 hover:text-purple-ink'
            }`}
          >
            Personal &amp; Delivery Information
            {activeTab === 'info' && (
              <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-gold rounded-t" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3.5 text-xs sm:text-sm font-semibold tracking-[0.15em] uppercase transition-all relative ${
              activeTab === 'orders'
                ? 'text-purple-ink font-bold'
                : 'text-purple-ink/50 hover:text-purple-ink'
            }`}
          >
            Order History ({orders.length})
            {activeTab === 'orders' && (
              <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-gold rounded-t" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('loyalty')}
            className={`pb-3.5 text-xs sm:text-sm font-semibold tracking-[0.15em] uppercase transition-all relative ${
              activeTab === 'loyalty'
                ? 'text-purple-ink font-bold'
                : 'text-purple-ink/50 hover:text-purple-ink'
            }`}
          >
            VIP Privileges
            {activeTab === 'loyalty' && (
              <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-gold rounded-t" />
            )}
          </button>
        </div>

        {/* Tab 1: Personal & Shipping Information Form */}
        {activeTab === 'info' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gold/20 shadow-sm animate-fade-in">
            <div className="mb-6 pb-4 border-b border-gold/15">
              <h2 className="font-serif text-xl sm:text-2xl text-purple-ink font-semibold">
                Your Delivery &amp; Contact Details
              </h2>
              <p className="text-xs text-purple-ink/60 mt-1">
                These details will automatically pre-fill your checkout delivery form for rapid single-click ordering.
              </p>
            </div>

            {saveSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
                <span className="font-bold text-emerald-600">✓</span>
                <span>Your profile and delivery information have been updated successfully!</span>
              </div>
            )}

            {saveError && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2 animate-fade-in">
                <span className="font-bold text-rose-600">✕</span>
                <span>{saveError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[0.72rem] tracking-[0.1em] uppercase text-purple-ink/70 font-semibold mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Adebayo Adeleke"
                    className="w-full px-4 py-3 bg-ivory border border-gold/25 rounded-xl text-sm text-purple-ink focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[0.72rem] tracking-[0.1em] uppercase text-purple-ink/70 font-semibold mb-2">
                    Email Address (Account Identifier)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-purple-ink/70 cursor-not-allowed"
                    title="Email is tied to your login credentials"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[0.72rem] tracking-[0.1em] uppercase text-purple-ink/70 font-semibold mb-2">
                    Phone Number (Required for Courier Dispatch) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0801 234 5678"
                    className="w-full px-4 py-3 bg-ivory border border-gold/25 rounded-xl text-sm text-purple-ink focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[0.72rem] tracking-[0.1em] uppercase text-purple-ink/70 font-semibold mb-2">
                    Delivery State / Region *
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-4 py-3 bg-ivory border border-gold/25 rounded-xl text-sm text-purple-ink focus:outline-none focus:border-gold transition-colors cursor-pointer"
                  >
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-[0.72rem] tracking-[0.1em] uppercase text-purple-ink/70 font-semibold mb-2">
                    Default Street / Residential Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Plot 15, Admiralty Way, Lekki Phase 1"
                    className="w-full px-4 py-3 bg-ivory border border-gold/25 rounded-xl text-sm text-purple-ink focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[0.72rem] tracking-[0.1em] uppercase text-purple-ink/70 font-semibold mb-2">
                    City / Neighborhood *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lekki, Ikeja, Ikoyi"
                    className="w-full px-4 py-3 bg-ivory border border-gold/25 rounded-xl text-sm text-purple-ink focus:outline-none focus:border-gold transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-8 py-3.5 bg-purple-darkest hover:bg-purple-deep text-white font-semibold text-xs tracking-[0.2em] uppercase rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    'Save Profile Information'
                  )}
                </button>

                <Link
                  href="/checkout"
                  className="w-full sm:w-auto px-8 py-3.5 bg-gold hover:bg-gold-bright text-purple-darkest font-semibold text-xs tracking-[0.15em] uppercase rounded-xl transition-all shadow text-center"
                >
                  Proceed to Checkout
                </Link>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Order History */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fade-in">
            {loadingOrders ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gold/20 shadow-sm">
                <span className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto block mb-3" />
                <p className="text-xs uppercase tracking-[0.15em] text-purple-ink/60 font-semibold">
                  Retrieving your atelier purchases...
                </p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gold/20 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-gold/15 flex items-center justify-center text-gold text-2xl mx-auto mb-4">
                  ✦
                </div>
                <h3 className="font-serif text-2xl text-purple-ink mb-2">No Orders Yet</h3>
                <p className="text-xs sm:text-sm text-purple-ink/60 max-w-[420px] mx-auto mb-6 leading-relaxed">
                  You have not placed any orders yet. Discover our artisanal candles and haute parfumerie to begin your personal collection.
                </p>
                <Link
                  href="/products"
                  className="inline-block px-8 py-3.5 bg-purple-darkest hover:bg-purple-deep text-white text-xs font-semibold tracking-[0.2em] uppercase rounded-xl transition-colors shadow-md"
                >
                  Explore Fragrances
                </Link>
              </div>
            ) : (
              orders.map((order) => {
                const isPaid = order.status === 'paid';
                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl p-6 sm:p-8 border border-gold/20 shadow-sm hover:border-gold/50 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gold/15">
                      <div>
                        <span className="text-[0.68rem] tracking-[0.15em] uppercase text-purple-ink/50 font-semibold block">
                          Reference
                        </span>
                        <strong className="font-mono text-base text-purple-deep tracking-wider">
                          {order.reference}
                        </strong>
                        <span className="text-[0.72rem] text-purple-ink/50 ml-3">
                          {new Date(order.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-[0.68rem] tracking-[0.1em] uppercase font-bold ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {isPaid ? '✓ Paid & Confirmed' : '● Processing'}
                        </span>
                        <Link
                          href={`/checkout/success?reference=${encodeURIComponent(order.reference)}`}
                          className="text-xs text-gold hover:text-gold-bright font-semibold underline underline-offset-4"
                        >
                          View Receipt →
                        </Link>
                      </div>
                    </div>

                    {/* Order Items Breakdown */}
                    {order.order_items && order.order_items.length > 0 && (
                      <div className="py-4 space-y-2 border-b border-gold/10">
                        {order.order_items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs text-purple-ink"
                          >
                            <span className="font-medium">
                              {item.name} <span className="text-purple-ink/50 font-normal">× {item.quantity}</span>
                            </span>
                            <span className="font-mono text-purple-deep font-semibold">
                              {formatNaira(item.unit_price_kobo * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                      <div className="text-purple-ink/60">
                        <span>Dispatch to: </span>
                        <strong>
                          {order.address ? `${order.address}, ${order.city}` : 'Lagos, Nigeria'}
                        </strong>
                      </div>
                      <div className="text-sm">
                        <span className="text-purple-ink/70">Total: </span>
                        <strong className="font-serif text-lg text-purple-deep">
                          {formatNaira(order.total_kobo)}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 3: VIP Privileges */}
        {activeTab === 'loyalty' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gold/20 shadow-sm space-y-6 animate-fade-in">
            <div>
              <h2 className="font-serif text-2xl text-purple-ink font-semibold">
                Your Atelier Privileges
              </h2>
              <p className="text-xs text-purple-ink/60 mt-1">
                As a registered connoisseur of Aroma De Luz, your profile automatically grants you our highest level of bespoke care.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              <div className="p-6 rounded-2xl bg-ivory border border-gold/20">
                <div className="text-2xl mb-2">📦</div>
                <h4 className="font-serif text-base text-purple-ink font-semibold">
                  White-Glove Packaging
                </h4>
                <p className="text-xs text-purple-ink/70 mt-1 leading-relaxed">
                  Every order includes signature velvet ribbon ties, protective gold-embossed boxes, and hand-addressed care cards.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-ivory border border-gold/20">
                <div className="text-2xl mb-2">✨</div>
                <h4 className="font-serif text-base text-purple-ink font-semibold">
                  Discovery Scent Vials
                </h4>
                <p className="text-xs text-purple-ink/70 mt-1 leading-relaxed">
                  Receive complimentary 2ml extrait de parfum discovery samples with every soy candle purchase.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-ivory border border-gold/20">
                <div className="text-2xl mb-2">⚡</div>
                <h4 className="font-serif text-base text-purple-ink font-semibold">
                  Priority Lagos Dispatch
                </h4>
                <p className="text-xs text-purple-ink/70 mt-1 leading-relaxed">
                  Orders placed by registered members are queued for same-day atelier packing and expedited 24–48 hour delivery.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

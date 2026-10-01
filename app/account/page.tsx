'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AccountPage() {
  const { user, loading, signOut, isDemo } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="inline-block w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] py-16 px-4 bg-cream">
      <div className="max-w-[800px] mx-auto">
        {/* Profile Card Header */}
        <div className="bg-white rounded-2xl p-8 md:p-10 shadow-[0_10px_40px_rgba(26,15,48,0.06)] border border-gold/15 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 pb-8 border-b border-gold/15">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-darkest via-purple-deep to-gold flex items-center justify-center text-white text-2xl font-serif font-bold shadow-lg">
                {user.fullName ? user.fullName[0].toUpperCase() : user.email[0].toUpperCase()}
              </div>
              <div>
                <h1 className="font-serif text-2xl md:text-3xl text-purple-ink font-semibold">
                  {user.fullName || 'Valued Client'}
                </h1>
                <p className="text-purple-ink/60 text-sm mt-0.5">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-3 py-0.5 rounded-full bg-gold/15 text-gold text-[0.68rem] tracking-[0.15em] uppercase font-semibold border border-gold/30">
                    VIP Fragrance Collector
                  </span>
                  {isDemo && (
                    <span className="px-2 py-0.5 rounded bg-purple-deep/10 text-purple-deep text-[0.65rem]">
                      Demo Account
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={signOut}
              className="text-xs font-semibold tracking-[0.15em] uppercase px-5 py-2.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
            >
              Sign Out
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-center">
            <div className="p-4 bg-ivory rounded-xl border border-gold/10">
              <p className="text-[0.7rem] uppercase tracking-[0.15em] text-purple-ink/50 font-medium">Orders</p>
              <p className="font-serif text-2xl text-purple-ink font-bold mt-1">0</p>
            </div>
            <div className="p-4 bg-ivory rounded-xl border border-gold/10">
              <p className="text-[0.7rem] uppercase tracking-[0.15em] text-purple-ink/50 font-medium">Complimentary Gifts</p>
              <p className="font-serif text-2xl text-gold font-bold mt-1">1 Pending</p>
            </div>
            <div className="p-4 bg-ivory rounded-xl border border-gold/10">
              <p className="text-[0.7rem] uppercase tracking-[0.15em] text-purple-ink/50 font-medium">Loyalty Tier</p>
              <p className="font-serif text-xl text-purple-deep font-bold mt-1">L&apos;Élite</p>
            </div>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Link
            href="/products"
            className="p-6 bg-white rounded-xl border border-gold/15 shadow-sm hover:border-gold hover:shadow-md transition-all group"
          >
            <h3 className="font-serif text-lg font-semibold text-purple-ink group-hover:text-gold transition-colors flex items-center justify-between">
              Explore Fragrances & Candles
              <span>→</span>
            </h3>
            <p className="text-xs text-purple-ink/60 mt-1.5 leading-relaxed">
              Browse the exclusive perfume bottles and organic soy scented candles.
            </p>
          </Link>

          <Link
            href="/#collections"
            className="p-6 bg-white rounded-xl border border-gold/15 shadow-sm hover:border-gold hover:shadow-md transition-all group"
          >
            <h3 className="font-serif text-lg font-semibold text-purple-ink group-hover:text-gold transition-colors flex items-center justify-between">
              Curated Collections
              <span>→</span>
            </h3>
            <p className="text-xs text-purple-ink/60 mt-1.5 leading-relaxed">
              Explore Floral Bouquets, Warm & Sensual, and Fresh & Radiant blends.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

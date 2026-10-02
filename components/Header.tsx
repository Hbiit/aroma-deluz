'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { SearchModal } from '@/components/SearchModal';
import type { Product } from '@/lib/types';

export function Header() {
  const { totalItems, openCart } = useCart();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Pre-load products for search
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-50 bg-ivory border-b border-gold/15 transition-shadow duration-300 ${
          scrolled ? 'shadow-[0_2px_20px_rgba(26,15,48,0.08)]' : ''
        }`}
      >
        <div className="max-w-[1320px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-3 items-center py-3.5 md:py-4">
            {/* Column 1: Mobile Toggle / Left Nav */}
            <div className="flex items-center">
              <button
                className="md:hidden text-purple-ink text-xl p-1 -ml-1 hover:text-gold transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? '✕' : '☰'}
              </button>

              <nav className="hidden md:flex items-center gap-5 lg:gap-8">
                <Link
                  href="/products"
                  className="text-[0.82rem] font-medium tracking-[0.1em] uppercase text-purple-ink hover:text-gold transition-colors relative group whitespace-nowrap"
                >
                  Shop All
                  <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-gold transition-all duration-300 group-hover:w-full" />
                </Link>
                <Link
                  href="/products?category=candle"
                  className="text-[0.82rem] font-medium tracking-[0.1em] uppercase text-purple-ink hover:text-gold transition-colors relative group whitespace-nowrap"
                >
                  Candles
                  <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-gold transition-all duration-300 group-hover:w-full" />
                </Link>
                <Link
                  href="/products?category=perfume"
                  className="text-[0.82rem] font-medium tracking-[0.1em] uppercase text-purple-ink hover:text-gold transition-colors relative group whitespace-nowrap"
                >
                  Perfumes
                  <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-gold transition-all duration-300 group-hover:w-full" />
                </Link>
              </nav>
            </div>

            {/* Column 2: Logo Centered in dedicated column */}
            <div className="flex items-center justify-center">
              <Link href="/" className="flex items-center justify-center group py-1">
                <Image
                  src="/brand-logo.jpg"
                  alt="Aroma De Luz - All About Scent"
                  width={180}
                  height={60}
                  className="h-10 sm:h-12 md:h-13 w-auto object-contain rounded-md border border-gold/30 shadow-md group-hover:scale-105 transition-all duration-300"
                  priority
                />
              </Link>
            </div>

            {/* Column 3: Right Nav Links + Actions, cleanly aligned to right edge */}
            <div className="flex items-center justify-end gap-3 sm:gap-5">
              <nav className="hidden md:flex items-center gap-5 lg:gap-7">
                <Link
                  href="/about"
                  className="text-[0.82rem] font-medium tracking-[0.12em] uppercase text-purple-ink hover:text-gold transition-colors relative group whitespace-nowrap"
                >
                  Our Story
                  <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-gold transition-all duration-300 group-hover:w-full" />
                </Link>
                <Link
                  href="/contact"
                  className="text-[0.82rem] font-medium tracking-[0.12em] uppercase text-purple-ink hover:text-gold transition-colors relative group whitespace-nowrap"
                >
                  Concierge
                  <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-gold transition-all duration-300 group-hover:w-full" />
                </Link>
              </nav>

              <div className="hidden md:block w-[1px] h-4 bg-gold/20 mx-1" />

              {/* Action Icons */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Account / Sign-In */}
                <Link
                  href={user ? '/profile' : '/auth'}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-purple-ink hover:text-gold transition-colors relative"
                  aria-label={user ? 'My Profile' : 'Sign In'}
                  title={user ? `Signed in as ${user.fullName || user.email}` : 'Sign In / Register'}
                >
                  {user ? (
                    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-darkest to-gold text-white text-[0.72rem] font-serif font-bold flex items-center justify-center shadow-sm">
                      {user.fullName ? user.fullName[0].toUpperCase() : user.email[0].toUpperCase()}
                    </span>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  )}
                </Link>

                {/* Instant Search */}
                <button
                  onClick={() => setSearchOpen(true)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-purple-ink hover:text-gold transition-colors"
                  aria-label="Search creations"
                  title="Search fragrances & candles"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                  </svg>
                </button>

                {/* Shopping Bag */}
                <button
                  className="w-9 h-9 rounded-full flex items-center justify-center text-purple-ink hover:text-gold transition-colors relative"
                  onClick={openCart}
                  aria-label="Cart"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                    <path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  {totalItems > 0 && (
                    <span className="absolute -top-0.5 -right-1 bg-purple-deep text-white text-[0.6rem] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileOpen && (
          <nav className="md:hidden bg-ivory border-t border-gold/15 px-6 py-5 flex flex-col gap-4 shadow-lg">
            <Link
              href="/products"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium tracking-[0.1em] uppercase text-purple-ink hover:text-gold transition-colors"
            >
              Shop All
            </Link>
            <Link
              href="/products?category=candle"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium tracking-[0.1em] uppercase text-purple-ink hover:text-gold transition-colors"
            >
              Candles
            </Link>
            <Link
              href="/products?category=perfume"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium tracking-[0.1em] uppercase text-purple-ink hover:text-gold transition-colors"
            >
              Perfumes
            </Link>
            <div className="w-full h-[1px] bg-gold/15 my-1" />
            <Link
              href="/about"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium tracking-[0.1em] uppercase text-purple-ink hover:text-gold transition-colors"
            >
              Our Story
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium tracking-[0.1em] uppercase text-purple-ink hover:text-gold transition-colors"
            >
              Concierge Contact
            </Link>
          </nav>
        )}
      </header>

      {/* Instant Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        products={products}
      />
    </>
  );
}

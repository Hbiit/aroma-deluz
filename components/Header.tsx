'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useCart } from '@/lib/cart-context';

export function Header() {
  const { totalItems, openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 bg-ivory border-b border-gold/15 transition-shadow duration-300 ${
        scrolled ? 'shadow-[0_2px_20px_rgba(26,15,48,0.08)]' : ''
      }`}
    >
      <div className="max-w-[1320px] mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between py-4 relative">
          {/* Mobile toggle */}
          <button
            className="md:hidden text-purple-ink text-xl"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>

          {/* Nav Left */}
          <nav className={`
            ${mobileOpen ? 'flex' : 'hidden'} md:flex
            flex-col md:flex-row items-start md:items-center gap-4 md:gap-8
            absolute md:static top-full left-0 right-0
            bg-ivory md:bg-transparent p-6 md:p-0
            border-b border-gold/15 md:border-0 z-50
          `}>
            <Link href="/products" className="text-[0.85rem] font-medium tracking-[0.1em] uppercase text-purple-ink hover:text-gold transition-colors relative group">
              Shop
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-gold transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link href="/products?collection=all" className="text-[0.85rem] font-medium tracking-[0.1em] uppercase text-purple-ink hover:text-gold transition-colors relative group">
              Collections
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-gold transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link href="/products?featured=true" className="text-[0.85rem] font-medium tracking-[0.1em] uppercase text-purple-ink hover:text-gold transition-colors relative group">
              Bestsellers
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-gold transition-all duration-300 group-hover:w-full" />
            </Link>
          </nav>

          {/* Logo */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 group py-1">
            <Image
              src="/brand-logo.jpg"
              alt="Aroma De Luz - All About Scent"
              width={180}
              height={60}
              className="h-11 md:h-14 w-auto object-contain rounded-md border border-gold/30 shadow-md group-hover:scale-105 transition-all duration-300"
              priority
            />
          </Link>

          {/* Nav Right */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#story" className="text-[0.85rem] font-medium tracking-[0.1em] uppercase text-purple-ink hover:text-gold transition-colors relative group">
              About
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-gold transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link href="/#newsletter" className="text-[0.85rem] font-medium tracking-[0.1em] uppercase text-purple-ink hover:text-gold transition-colors relative group">
              Contact
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-gold transition-all duration-300 group-hover:w-full" />
            </Link>
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-full flex items-center justify-center text-purple-ink hover:text-gold transition-colors" aria-label="Search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
            </button>
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
    </header>
  );
}

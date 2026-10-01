'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatNaira } from '@/lib/utils';
import type { Product } from '@/lib/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

export function SearchModal({ isOpen, onClose, products }: SearchModalProps) {
  const [query, setQuery] = useState('');

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const results = query.trim()
    ? products.filter(p => {
        const q = query.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.collection?.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.scent_notes?.some(n => n.toLowerCase().includes(q))
        );
      })
    : [];

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col bg-purple-darkest/95 backdrop-blur-md animate-fade-in p-4 sm:p-8">
      {/* Header */}
      <div className="max-w-[750px] mx-auto w-full flex items-center justify-between pb-6 border-b border-gold/20">
        <span className="font-serif text-gold text-lg tracking-[0.1em] uppercase">
          Search Atelier Creations
        </span>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-gold text-2xl transition-colors p-2"
          aria-label="Close search"
        >
          ✕
        </button>
      </div>

      {/* Input */}
      <div className="max-w-[750px] mx-auto w-full my-8">
        <div className="relative">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type candle name, perfume, or notes like Rose, Amber, Oud..."
            className="w-full pl-12 pr-6 py-4 bg-white/10 border-2 border-gold/40 focus:border-gold rounded-2xl text-white placeholder:text-white/40 text-base md:text-lg focus:outline-none transition-all shadow-lg"
          />
          <svg
            className="w-6 h-6 text-gold absolute left-4 top-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" strokeWidth="1.5" />
            <path d="m21 21-4.3-4.3" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-[750px] mx-auto w-full flex-1 overflow-y-auto pr-2">
        {query.trim() ? (
          results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-12">
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-4 p-3.5 bg-white/5 hover:bg-white/10 border border-gold/20 rounded-xl transition-all group"
                >
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-cream flex-shrink-0">
                    <Image
                      src={product.image_url || '/product-lamour.jpg'}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-base text-white group-hover:text-gold transition-colors truncate">
                      {product.name}
                    </h4>
                    <p className="text-[0.7rem] text-gold uppercase tracking-[0.1em]">
                      {product.category === 'candle' ? 'Scented Candle' : 'Eau de Parfum'}
                    </p>
                    <p className="font-serif text-sm font-semibold text-white/90 mt-1">
                      {formatNaira(product.price_kobo)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-white/50 text-sm">
              No creations matching &ldquo;{query}&rdquo;. Try &ldquo;Rose&rdquo;, &ldquo;Amber&rdquo;, or &ldquo;Candle&rdquo;.
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <p className="text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-4">
              Trending Scent Searches
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Velvet Rose', 'Amber Oud', 'L\'Amour', 'Lavender', 'Soy Candle', 'Rose Noir'].map(term => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

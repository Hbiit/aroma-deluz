'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/ProductCard';
import type { Product } from '@/lib/types';

interface ProductsCatalogProps {
  initialProducts: Product[];
}

const COLLECTIONS = [
  'All Collections',
  'Floral Bouquets',
  'Warm & Sensual',
  'Fresh & Radiant',
  'Exclusive Collection',
];

const CATEGORIES = [
  { label: 'All Creations', value: 'all' },
  { label: 'Scented Candles', value: 'candle' },
  { label: 'Fine Perfumes', value: 'perfume' },
];

export function ProductsCatalog({ initialProducts }: ProductsCatalogProps) {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const initialCollection = searchParams.get('collection') || 'All Collections';

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedCollection, setSelectedCollection] = useState<string>(
    initialCollection === 'all' ? 'All Collections' : initialCollection
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  const [activeScentNote, setActiveScentNote] = useState<string | null>(null);

  // Extract all unique scent notes
  const allScentNotes = useMemo(() => {
    const notesSet = new Set<string>();
    initialProducts.forEach(p => {
      p.scent_notes?.forEach(n => notesSet.add(n));
    });
    return Array.from(notesSet).slice(0, 10);
  }, [initialProducts]);

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    return initialProducts.filter(p => {
      // Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }
      // Collection filter
      if (selectedCollection !== 'All Collections' && p.collection !== selectedCollection) {
        return false;
      }
      // Scent Note filter
      if (activeScentNote && !p.scent_notes?.includes(activeScentNote)) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesDesc = p.description?.toLowerCase().includes(query);
        const matchesNotes = p.scent_notes?.some(n => n.toLowerCase().includes(query));
        const matchesCollection = p.collection?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesNotes && !matchesCollection) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price_kobo - b.price_kobo;
      if (sortBy === 'price-desc') return b.price_kobo - a.price_kobo;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      // featured
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
  }, [initialProducts, selectedCategory, selectedCollection, activeScentNote, searchQuery, sortBy]);

  return (
    <div className="max-w-[1320px] mx-auto px-4 md:px-8 py-12">
      {/* Category Pills & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-gold/15">
        {/* Categories */}
        <div className="flex items-center gap-2 p-1.5 bg-ivory rounded-xl border border-gold/20 shadow-sm w-full md:w-auto overflow-x-auto">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-5 py-2.5 rounded-lg text-xs font-semibold tracking-[0.15em] uppercase transition-all whitespace-nowrap ${
                selectedCategory === cat.value
                  ? 'bg-purple-darkest text-white shadow-md'
                  : 'text-purple-ink/70 hover:text-purple-ink hover:bg-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input & Sort */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scent, notes, wood..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gold/25 rounded-lg text-xs text-purple-ink placeholder:text-purple-ink/40 focus:outline-none focus:border-gold transition-colors"
            />
            <svg
              className="w-4 h-4 text-gold absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" strokeWidth="1.5" />
              <path d="m21 21-4.3-4.3" strokeWidth="1.5" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-ink/40 hover:text-purple-ink text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2.5 bg-white border border-gold/25 rounded-lg text-xs font-medium text-purple-ink focus:outline-none focus:border-gold cursor-pointer"
          >
            <option value="featured">Featured First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Collection Sub-filters & Scent Pills */}
      <div className="flex flex-col gap-4 py-6">
        {/* Collections */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-gold font-semibold tracking-[0.1em] uppercase text-[0.7rem] mr-2">Collection:</span>
          {COLLECTIONS.map(col => (
            <button
              key={col}
              onClick={() => setSelectedCollection(col)}
              className={`px-3.5 py-1.5 rounded-full border text-[0.72rem] transition-all whitespace-nowrap ${
                selectedCollection === col
                  ? 'bg-gold text-purple-darkest font-semibold border-gold shadow-sm'
                  : 'bg-white text-purple-ink/70 border-gold/20 hover:border-gold hover:text-purple-ink'
              }`}
            >
              {col}
            </button>
          ))}
        </div>

        {/* Olfactory Scent Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-gold font-semibold tracking-[0.1em] uppercase text-[0.7rem] mr-2">Scent Note:</span>
          {allScentNotes.map(note => {
            const isActive = activeScentNote === note;
            return (
              <button
                key={note}
                onClick={() => setActiveScentNote(isActive ? null : note)}
                className={`px-3 py-1 rounded-full text-[0.68rem] transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-purple-deep text-white font-medium shadow-sm'
                    : 'bg-cream text-purple-ink/65 hover:bg-purple-deep/10'
                }`}
              >
                {isActive ? `✕ ${note}` : `+ ${note}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Filter Clear Bar */}
      {(selectedCategory !== 'all' || selectedCollection !== 'All Collections' || activeScentNote || searchQuery) && (
        <div className="flex items-center justify-between bg-gold/10 px-4 py-2.5 rounded-lg border border-gold/25 mb-8 text-xs">
          <span className="text-purple-ink/80">
            Showing <strong>{filteredProducts.length}</strong> matching luxury items
          </span>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedCollection('All Collections');
              setActiveScentNote(null);
              setSearchQuery('');
            }}
            className="text-purple-darkest font-semibold hover:text-gold uppercase tracking-[0.1em] transition-colors"
          >
            Clear All Filters ✕
          </button>
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-2xl border border-gold/15 p-8">
          <div className="font-serif text-3xl text-purple-ink mb-2">No Fragrances Found</div>
          <p className="text-purple-ink/60 text-sm max-w-[400px] mx-auto mb-6">
            We couldn&apos;t find any items matching your selected criteria. Try adjusting your filters or search terms.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedCollection('All Collections');
              setActiveScentNote(null);
              setSearchQuery('');
            }}
            className="px-6 py-3 bg-purple-darkest text-white text-xs font-semibold tracking-[0.15em] uppercase rounded-lg hover:bg-purple-deep transition-colors"
          >
            Reset Catalog
          </button>
        </div>
      )}
    </div>
  );
}

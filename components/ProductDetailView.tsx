'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { formatNaira } from '@/lib/utils';
import type { Product } from '@/lib/types';

interface ProductDetailViewProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductDetailView({ product, relatedProducts }: ProductDetailViewProps) {
  const { addItem, openCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'profile' | 'ritual' | 'packaging'>('profile');
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    addItem(
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price_kobo: product.price_kobo,
        image_url: product.image_url || '/product-lamour.jpg',
      },
      quantity
    );
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 2000);
  };

  const isCandle = product.category === 'candle';

  return (
    <div className="max-w-[1320px] mx-auto px-4 md:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-purple-ink/50 uppercase tracking-[0.15em] mb-8 font-medium">
        <Link href="/" className="hover:text-gold transition-colors">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-gold transition-colors">Shop</Link>
        <span>/</span>
        <Link href={`/products?category=${product.category}`} className="hover:text-gold transition-colors">
          {isCandle ? 'Candles' : 'Perfumes'}
        </Link>
        <span>/</span>
        <span className="text-purple-ink font-semibold">{product.name}</span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start pb-16 border-b border-gold/15">
        {/* Left: Product Image Showcase */}
        <div className="relative group rounded-2xl overflow-hidden bg-white p-3 border border-gold/20 shadow-[0_20px_60px_rgba(26,15,48,0.08)]">
          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-cream">
            <Image
              src={product.image_url || '/product-lamour.jpg'}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {/* Luxury Badge */}
            <div className="absolute top-4 left-4 bg-purple-darkest/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-gold/40 text-gold text-[0.7rem] tracking-[0.2em] uppercase font-semibold">
              {isCandle ? 'Hand-Poured Soy Wax' : 'Extrait de Parfum'}
            </div>
            {product.featured && (
              <div className="absolute top-4 right-4 bg-gold text-purple-darkest px-3 py-1 rounded-full text-[0.68rem] tracking-[0.15em] uppercase font-bold shadow-md">
                Bestseller
              </div>
            )}
          </div>
        </div>

        {/* Right: Product Details & Purchase Form */}
        <div className="flex flex-col">
          {/* Collection & Category */}
          <div className="flex items-center gap-3 text-xs tracking-[0.2em] uppercase text-gold font-semibold mb-2">
            <span>{product.collection || 'Exclusive Collection'}</span>
            <span>·</span>
            <span>{isCandle ? 'Scented Candle' : 'Fine Fragrance'}</span>
          </div>

          {/* Title */}
          <h1 className="font-serif text-3xl md:text-5xl text-purple-ink font-normal leading-[1.15] mb-3">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-3 mb-5">
            <div className="text-gold text-sm tracking-[0.2em]">★★★★★</div>
            <span className="text-xs text-purple-ink/60 font-medium">4.9 / 5.0 (38 Connoisseur Reviews)</span>
          </div>

          {/* Price */}
          <div className="font-serif text-2xl md:text-3xl font-semibold text-purple-deep mb-6">
            {formatNaira(product.price_kobo)}
          </div>

          {/* Short Description */}
          <p className="text-purple-ink/80 text-sm leading-relaxed mb-6 font-light">
            {product.description ||
              'Meticulously composed using rare raw essences and organic materials to transform your ambience with opulent elegance.'}
          </p>

          {/* Scent Notes Badges */}
          {product.scent_notes && product.scent_notes.length > 0 && (
            <div className="mb-8 p-4 rounded-xl bg-ivory border border-gold/20">
              <p className="text-[0.7rem] uppercase tracking-[0.2em] text-gold font-semibold mb-2.5">
                Olfactory Scent Notes
              </p>
              <div className="flex flex-wrap gap-2">
                {product.scent_notes.map((note) => (
                  <span
                    key={note}
                    className="px-3 py-1 rounded-full bg-white text-purple-ink text-xs font-medium border border-gold/20 shadow-sm"
                  >
                    ✦ {note}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Specs / Volume */}
          <div className="grid grid-cols-2 gap-3 mb-8 text-xs">
            <div className="p-3 bg-white rounded-lg border border-gold/15">
              <span className="text-purple-ink/50 uppercase tracking-[0.1em] text-[0.65rem] block">Format</span>
              <strong className="text-purple-ink mt-0.5 block">
                {isCandle ? '300g (10.5 oz)' : '100ml (3.4 fl oz)'}
              </strong>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gold/15">
              <span className="text-purple-ink/50 uppercase tracking-[0.1em] text-[0.65rem] block">Performance</span>
              <strong className="text-purple-ink mt-0.5 block">
                {isCandle ? '70+ Hours Clean Burn' : '14+ Hours Wear'}
              </strong>
            </div>
          </div>

          {/* Quantity Selector & Add To Bag */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center border border-gold/30 rounded-xl bg-white p-1">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center text-purple-ink text-base hover:text-gold transition-colors"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-10 text-center font-semibold text-purple-ink text-sm">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 flex items-center justify-center text-purple-ink text-base hover:text-gold transition-colors"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className={`flex-1 py-4 px-8 rounded-xl font-semibold text-xs tracking-[0.2em] uppercase transition-all duration-300 shadow-md ${
                added
                  ? 'bg-emerald-700 text-white'
                  : 'bg-purple-darkest hover:bg-gold hover:text-purple-darkest text-white'
              }`}
            >
              {added ? '✓ Added To Bag' : 'Add To Bag'}
            </button>
          </div>

          {/* Complimentary Pillars */}
          <div className="space-y-2.5 text-xs text-purple-ink/75 pt-6 border-t border-gold/15">
            <div className="flex items-center gap-2.5">
              <span className="text-gold">🚚</span>
              <span>Complimentary express delivery across Nigeria over ₦150,000</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-gold">🎁</span>
              <span>Presented in signature Aroma De Luz embossed purple & gold gift box</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-gold">✦</span>
              <span>2 complimentary discovery fragrance vials included with every order</span>
            </div>
          </div>
        </div>
      </div>

      {/* Accordion Tabs */}
      <div className="py-12 max-w-[900px] mx-auto">
        <div className="flex items-center justify-center gap-4 border-b border-gold/20 pb-4 mb-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`text-xs uppercase tracking-[0.2em] font-semibold pb-2 border-b-2 transition-all ${
              activeTab === 'profile'
                ? 'border-gold text-purple-darkest'
                : 'border-transparent text-purple-ink/50 hover:text-purple-ink'
            }`}
          >
            The Fragrance Profile
          </button>
          <button
            onClick={() => setActiveTab('ritual')}
            className={`text-xs uppercase tracking-[0.2em] font-semibold pb-2 border-b-2 transition-all ${
              activeTab === 'ritual'
                ? 'border-gold text-purple-darkest'
                : 'border-transparent text-purple-ink/50 hover:text-purple-ink'
            }`}
          >
            {isCandle ? 'Burning Ritual & Care' : 'Application Ritual'}
          </button>
          <button
            onClick={() => setActiveTab('packaging')}
            className={`text-xs uppercase tracking-[0.2em] font-semibold pb-2 border-b-2 transition-all ${
              activeTab === 'packaging'
                ? 'border-gold text-purple-darkest'
                : 'border-transparent text-purple-ink/50 hover:text-purple-ink'
            }`}
          >
            Artisanal Heritage
          </button>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-gold/15 text-sm text-purple-ink/80 leading-relaxed shadow-sm">
          {activeTab === 'profile' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-serif text-2xl text-purple-ink">A Symphony of Rare Essences</h3>
              <p>
                {product.name} opens with luminous harmony, developing into an intoxicating, layered sillage that lasts effortlessly throughout the day and evening.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gold/10">
                <div>
                  <h4 className="text-[0.7rem] uppercase tracking-[0.15em] text-gold font-bold mb-1">Top Notes</h4>
                  <p className="text-xs text-purple-ink/70">{product.scent_notes?.[0] || 'Bergamot, Pink Pepper'}</p>
                </div>
                <div>
                  <h4 className="text-[0.7rem] uppercase tracking-[0.15em] text-gold font-bold mb-1">Heart Notes</h4>
                  <p className="text-xs text-purple-ink/70">{product.scent_notes?.[1] || 'Velvet Rose, Peony'}</p>
                </div>
                <div>
                  <h4 className="text-[0.7rem] uppercase tracking-[0.15em] text-gold font-bold mb-1">Base Notes</h4>
                  <p className="text-xs text-purple-ink/70">{product.scent_notes?.[2] || 'Rare Oud, Amber, White Musk'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ritual' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-serif text-2xl text-purple-ink">
                {isCandle ? 'Candle Burning Best Practices' : 'Prolonging Your Sillage'}
              </h3>
              {isCandle ? (
                <ul className="list-disc list-inside space-y-2 text-xs md:text-sm">
                  <li><strong>The First Burn:</strong> Allow the candle to burn for at least 3 hours until a complete liquid wax pool covers the entire surface.</li>
                  <li><strong>Wick Trimming:</strong> Trim cotton wick to 5mm before every lighting to prevent smoke and promote clean, even burning.</li>
                  <li><strong>Safe Placement:</strong> Always place on heat-resistant surfaces away from drafts, flammable objects, and children.</li>
                  <li><strong>Storage:</strong> Preserve fragrance oils by replacing the lid and storing away from direct sunlight.</li>
                </ul>
              ) : (
                <ul className="list-disc list-inside space-y-2 text-xs md:text-sm">
                  <li><strong>Pulse Points:</strong> Mist gently onto warm pulse points: wrists, inner elbows, base of throat, and behind ears.</li>
                  <li><strong>Do Not Rub:</strong> Allow the fragrance to dry down naturally to avoid crushing the delicate top and heart molecules.</li>
                  <li><strong>Layering:</strong> Enhance longevity by applying unfragranced moisturizer before spraying.</li>
                </ul>
              )}
            </div>
          )}

          {activeTab === 'packaging' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-serif text-2xl text-purple-ink">Hand-Crafted in Lagos, Nigeria</h3>
              <p>
                Every Aroma De Luz creation honors the traditions of haute perfumery. Our organic candles are poured in small artisanal batches using 100% natural soy wax, lead-free wicks, and pure botanical essences.
              </p>
              <p className="text-xs text-purple-ink/70 italic">
                Sustainable, cruelty-free, paraben-free, and proudly created to leave a legacy.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="pt-12">
          <h2 className="font-serif text-2xl md:text-3xl text-purple-ink text-center mb-8 uppercase tracking-[0.08em]">
            You May Also Adore
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {relatedProducts.slice(0, 4).map((rel) => (
              <Link
                key={rel.id}
                href={`/products/${rel.slug}`}
                className="bg-white rounded-xl overflow-hidden border border-gold/15 p-3 hover:shadow-lg hover:-translate-y-1 transition-all group"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden bg-cream mb-3">
                  <Image
                    src={rel.image_url || '/product-lamour.jpg'}
                    alt={rel.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                </div>
                <h4 className="font-serif text-base font-semibold text-purple-ink group-hover:text-gold transition-colors">
                  {rel.name}
                </h4>
                <p className="text-[0.7rem] text-gold uppercase tracking-[0.1em] mt-0.5">
                  {rel.category === 'candle' ? 'Candle' : 'Perfume'}
                </p>
                <p className="font-serif text-sm font-semibold text-purple-deep mt-1">
                  {formatNaira(rel.price_kobo)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { formatNaira } from '@/lib/utils';
import type { Product } from '@/lib/types';

export function ProductCard({ product }: { product: Product }) {
  const { addItem, openCart } = useCart();
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price_kobo: product.price_kobo,
      image_url: product.image_url || '/product-lamour.jpg',
    });
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="bg-white rounded-md overflow-hidden transition-all duration-300 hover:shadow-[0_12px_40px_rgba(26,15,48,0.1)] hover:-translate-y-1 group">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-cream">
          <Image
            src={product.image_url || '/product-lamour.jpg'}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-600 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 20vw"
          />
          <button
            onClick={(e) => { e.preventDefault(); setWishlisted(!wishlisted); }}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center transition-all duration-300 hover:scale-110 ${
              wishlisted ? 'text-red-500' : 'text-purple-ink'
            }`}
            aria-label="Toggle wishlist"
          >
            {wishlisted ? '♥' : '♡'}
          </button>
        </div>
      </Link>

      <div className="p-4 pb-5">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-serif text-lg font-semibold text-purple-ink hover:text-gold transition-colors">{product.name}</h3>
        </Link>
        <p className="text-[0.72rem] text-gold tracking-[0.1em] uppercase font-medium mt-0.5 mb-2">
          {product.category === 'perfume' ? 'Eau de Parfum' : 'Scented Candle'}
        </p>
        <p className="font-serif text-lg font-semibold text-purple-deep mb-3">
          {formatNaira(product.price_kobo)}
        </p>
        <button
          type="button"
          onClick={handleAddToCart}
          className={`w-full text-[0.72rem] font-semibold tracking-[0.15em] uppercase py-2.5 rounded transition-all duration-300 ${
            added
              ? 'bg-green-700 text-white'
              : 'bg-purple-darkest text-white hover:bg-purple-deep'
          }`}
        >
          {added ? '✓ Added' : 'Add To Cart'}
        </button>
      </div>
    </div>
  );
}

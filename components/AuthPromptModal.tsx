'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/cart-context';
import { formatNaira } from '@/lib/utils';

export function AuthPromptModal() {
  const { isAuthModalOpen, closeAuthModal, lastAddedItem, openCart } = useCart();

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-purple-darkest/80 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={closeAuthModal}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-purple-darkest border border-gold/35 rounded-2xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.7)] text-center text-ivory z-10 animate-fade-in-up">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-ivory/50 hover:text-gold text-2xl transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gold/10"
          aria-label="Close dialog"
        >
          ×
        </button>

        {/* Brand Crest */}
        <div className="mx-auto w-12 h-12 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center text-gold text-xl mb-4 shadow-[0_0_20px_rgba(201,164,92,0.2)]">
          ✦
        </div>

        <p className="text-[0.68rem] tracking-[0.25em] uppercase text-gold font-semibold mb-1">
          Aroma De Luz &bull; Private Atelier
        </p>

        <h3 className="font-serif text-2xl sm:text-3xl text-ivory font-semibold mb-3">
          Sign In to Complete Your Order
        </h3>

        {/* Product highlight */}
        {lastAddedItem && (
          <div className="bg-purple-deep/40 border border-gold/20 rounded-xl p-3 mb-4 flex items-center gap-3 text-left">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-cream flex-shrink-0 border border-gold/20">
              <Image
                src={lastAddedItem.image_url}
                alt={lastAddedItem.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-serif text-xs text-ivory font-semibold truncate">
                {lastAddedItem.name}
              </p>
              <p className="text-[0.7rem] text-gold mt-0.5">
                Added to your bag &bull; {formatNaira(lastAddedItem.price_kobo)}
              </p>
            </div>
          </div>
        )}

        <p className="text-xs text-ivory/70 leading-relaxed mb-6">
          To preserve your bespoke bag, unlock white-glove packaging, and complete your order, please sign in or create an account.
        </p>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <Link
            href="/auth?redirect=/checkout"
            onClick={closeAuthModal}
            className="block w-full py-3.5 px-6 bg-gold hover:bg-gold-bright text-purple-darkest font-semibold text-xs tracking-[0.2em] uppercase rounded-xl transition-all shadow-md hover:shadow-lg text-center"
          >
            Sign In / Create Account
          </Link>

          <button
            onClick={() => {
              closeAuthModal();
              openCart();
            }}
            className="w-full py-3 px-6 text-xs text-ivory/60 hover:text-ivory tracking-[0.1em] uppercase transition-colors"
          >
            View Bag &amp; Continue Browsing
          </button>
        </div>
      </div>
    </div>
  );
}

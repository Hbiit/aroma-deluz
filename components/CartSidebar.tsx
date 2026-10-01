'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { formatNaira } from '@/lib/utils';

export function CartSidebar() {
  const { items, removeItem, updateQty, totalItems, totalFormatted, isOpen, closeCart, openAuthModal } = useCart();
  const { user } = useAuth();

  const handleProceedToCheckout = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      closeCart();
      openAuthModal();
    } else {
      closeCart();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-purple-ink/50 z-[9998] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeCart}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 w-[420px] max-w-[90vw] h-screen bg-white z-[9999] flex flex-col shadow-[-10px_0_40px_rgba(26,15,48,0.15)] transition-transform duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gold/15">
          <h3 className="font-serif text-xl text-purple-ink">Your Cart ({totalItems})</h3>
          <button onClick={closeCart} className="text-2xl text-purple-ink hover:text-gold transition-colors" aria-label="Close cart">×</button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="text-center py-12 text-purple-ink/50">
              <svg className="w-12 h-12 mx-auto mb-4 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <p className="font-medium">Your cart is empty</p>
              <p className="text-sm mt-1">Discover our exquisite collection</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex gap-4 py-4 border-b border-gold/10">
                <div className="w-20 h-20 rounded overflow-hidden bg-cream flex-shrink-0">
                  <Image src={item.image_url} alt={item.name} width={80} height={80} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="font-serif font-semibold text-purple-ink">{item.name}</p>
                  <p className="text-sm text-gold mt-0.5">{formatNaira(item.price_kobo)}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="w-7 h-7 border border-gold/30 rounded text-purple-ink text-sm flex items-center justify-center hover:border-gold hover:text-gold transition-colors"
                    >−</button>
                    <span className="text-sm font-medium">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="w-7 h-7 border border-gold/30 rounded text-purple-ink text-sm flex items-center justify-center hover:border-gold hover:text-gold transition-colors"
                    >+</button>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-purple-ink/30 hover:text-red-500 transition-colors text-xl self-start"
                >×</button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-gold/15 bg-cream">
            <div className="flex justify-between mb-3 text-lg font-semibold text-purple-ink">
              <span>Subtotal</span>
              <span className="font-serif text-purple-deep">{totalFormatted}</span>
            </div>

            <Link
              href="/checkout"
              onClick={handleProceedToCheckout}
              className="block w-full bg-purple-darkest text-white text-center text-[0.8rem] font-semibold tracking-[0.2em] uppercase py-3.5 rounded hover:bg-purple-deep transition-colors shadow-sm"
            >
              Proceed To Checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}

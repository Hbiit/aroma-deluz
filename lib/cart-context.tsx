'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { CartItem } from '@/lib/types';
import { formatNaira } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalKobo: number;
  totalAmount: number;
  totalFormatted: string;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  lastAddedItem: CartItem | null;
}

const CartContext = createContext<CartContextType | null>(null);

const GUEST_STORAGE_KEY = 'aroma_guest_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<CartItem | null>(null);
  const [mounted, setMounted] = useState(false);

  const activeUserId = user?.id || null;

  // Immediate synchronous helper to persist cart to localStorage
  const saveCartToStorage = useCallback(
    (newItems: CartItem[]) => {
      if (typeof window === 'undefined') return;
      try {
        const storageKey = activeUserId ? `aroma_cart_${activeUserId}` : GUEST_STORAGE_KEY;
        localStorage.setItem(storageKey, JSON.stringify(newItems));
      } catch (e) {
        console.warn('Failed to persist cart to storage:', e);
      }
    },
    [activeUserId]
  );

  // Initial load on mount or when user account transitions
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const userKey = activeUserId ? `aroma_cart_${activeUserId}` : null;
      let loadedItems: CartItem[] = [];

      if (userKey) {
        const stored = localStorage.getItem(userKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) loadedItems = parsed;
        }
      }

      // Check for guest cart items to migrate or use
      const guestStored = localStorage.getItem(GUEST_STORAGE_KEY);
      if (guestStored) {
        const parsedGuest = JSON.parse(guestStored);
        if (Array.isArray(parsedGuest) && parsedGuest.length > 0) {
          if (userKey) {
            // Merge guest items into signed-in user cart
            parsedGuest.forEach((g: CartItem) => {
              const existing = loadedItems.find((u) => u.id === g.id || u.slug === g.slug);
              if (existing) {
                existing.qty += g.qty;
              } else {
                loadedItems.push(g);
              }
            });
            localStorage.removeItem(GUEST_STORAGE_KEY);
            localStorage.setItem(userKey, JSON.stringify(loadedItems));
          } else {
            loadedItems = parsedGuest;
          }
        }
      }

      setItems(loadedItems);
    } catch (err) {
      console.warn('Error reading cart from localStorage:', err);
    } finally {
      setMounted(true);
    }
  }, [activeUserId]);

  // Add Item to cart
  const addItem = useCallback(
    (item: Omit<CartItem, 'qty'>, qtyToAdd: number = 1) => {
      const count = Math.max(1, qtyToAdd);
      const targetItem: CartItem = {
        id: item.id,
        slug: item.slug || item.id,
        name: item.name,
        price_kobo: item.price_kobo || 0,
        image_url: item.image_url || '/product-lamour.jpg',
        qty: count,
      };

      setLastAddedItem(targetItem);

      setItems((prev) => {
        const currentList = Array.isArray(prev) ? prev : [];
        const existingIndex = currentList.findIndex(
          (i) => i.id === item.id || (item.slug && i.slug === item.slug)
        );

        let nextList: CartItem[];
        if (existingIndex > -1) {
          nextList = currentList.map((i, idx) =>
            idx === existingIndex ? { ...i, qty: i.qty + count } : i
          );
        } else {
          nextList = [...currentList, targetItem];
        }

        saveCartToStorage(nextList);
        return nextList;
      });

      // Always automatically open the cart sidebar so user sees immediate feedback
      setIsOpen(true);
    },
    [saveCartToStorage]
  );

  // Remove Item
  const removeItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const currentList = Array.isArray(prev) ? prev : [];
        const nextList = currentList.filter((i) => i.id !== id);
        saveCartToStorage(nextList);
        return nextList;
      });
    },
    [saveCartToStorage]
  );

  // Update Item Quantity
  const updateQty = useCallback(
    (id: string, delta: number) => {
      setItems((prev) => {
        const currentList = Array.isArray(prev) ? prev : [];
        const nextList = currentList
          .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
          .filter((i) => i.qty > 0);
        saveCartToStorage(nextList);
        return nextList;
      });
    },
    [saveCartToStorage]
  );

  // Cross-tab synchronization
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleCartCleared = () => {
      setItems([]);
    };

    const handleStorageChange = (e: StorageEvent) => {
      const activeKey = activeUserId ? `aroma_cart_${activeUserId}` : GUEST_STORAGE_KEY;
      if (e.key === activeKey) {
        if (!e.newValue) {
          setItems([]);
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            if (Array.isArray(parsed)) setItems(parsed);
          } catch {}
        }
      }
    };

    window.addEventListener('cart-cleared', handleCartCleared);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('cart-cleared', handleCartCleared);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [activeUserId]);

  // Clear Cart
  const clearCart = useCallback(() => {
    setItems([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(GUEST_STORAGE_KEY);
        if (activeUserId) {
          localStorage.removeItem(`aroma_cart_${activeUserId}`);
        }
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('aroma_cart') || k === GUEST_STORAGE_KEY)) {
            localStorage.removeItem(k);
          }
        }
      } catch {}

      window.dispatchEvent(new Event('cart-cleared'));
    }
  }, [activeUserId]);

  const totalItems = items.reduce((sum, i) => sum + (i.qty || 1), 0);
  const totalKobo = items.reduce((sum, i) => sum + (i.price_kobo || 0) * (i.qty || 1), 0);
  const totalAmount = totalKobo;
  const totalFormatted = formatNaira(totalKobo);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        totalItems,
        totalKobo,
        totalAmount,
        totalFormatted,
        isOpen,
        openCart,
        closeCart,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        lastAddedItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

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
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<CartItem | null>(null);
  const [mounted, setMounted] = useState(false);

  // Track previous user to detect login and logout transitions
  const prevUserIdRef = useRef<string | null>(null);

  // Load / migrate cart based on active user
  useEffect(() => {
    if (authLoading) return;

    if (user?.id) {
      // User is logged in
      const userKey = `aroma_cart_${user.id}`;
      let userItems: CartItem[] = [];

      try {
        const stored = localStorage.getItem(userKey);
        if (stored) userItems = JSON.parse(stored);
      } catch {}

      // If user had staged items while browsing as guest, merge them into their account cart
      try {
        const guestStored = localStorage.getItem(GUEST_STORAGE_KEY);
        if (guestStored) {
          const guestItems: CartItem[] = JSON.parse(guestStored);
          guestItems.forEach((gItem) => {
            const existing = userItems.find((u) => u.id === gItem.id);
            if (existing) {
              existing.qty += gItem.qty;
            } else {
              userItems.push(gItem);
            }
          });
          localStorage.removeItem(GUEST_STORAGE_KEY);
        }
      } catch {}

      setItems(userItems);
      prevUserIdRef.current = user.id;
    } else {
      // User is NOT logged in / logged out
      // When a user logs out, their cart is NOT accessible unless they log back in
      if (prevUserIdRef.current !== null) {
        setItems([]);
        setIsOpen(false);
        prevUserIdRef.current = null;
      } else {
        // Load any temporary guest staged cart if exists
        try {
          const guestStored = localStorage.getItem(GUEST_STORAGE_KEY);
          if (guestStored) setItems(JSON.parse(guestStored));
        } catch {}
      }
    }

    setMounted(true);
  }, [user, authLoading]);

  // Persist items whenever they change
  useEffect(() => {
    if (!mounted || authLoading) return;

    if (user?.id) {
      // Persist to user's private account storage
      localStorage.setItem(`aroma_cart_${user.id}`, JSON.stringify(items));
    } else {
      // Persist to temporary guest storage
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, user, mounted, authLoading]);

  const addItem = useCallback(
    (item: Omit<CartItem, 'qty'>, qtyToAdd: number = 1) => {
      const addCount = Math.max(1, qtyToAdd);
      const targetItem: CartItem = { ...item, qty: addCount };
      setLastAddedItem(targetItem);

      setItems((prev) => {
        const existing = prev.find((i) => i.id === item.id);
        if (existing) {
          return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + addCount } : i));
        }
        return [...prev, targetItem];
      });

      // Open the cart drawer
      setIsOpen(true);
    },
    []
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQty = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    if (user?.id) {
      localStorage.removeItem(`aroma_cart_${user.id}`);
    } else {
      localStorage.removeItem(GUEST_STORAGE_KEY);
    }
  }, [user]);

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
  const totalKobo = items.reduce((sum, i) => sum + i.price_kobo * i.qty, 0);
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

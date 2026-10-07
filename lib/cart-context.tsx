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
  distinctItems: number;
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

// Safe merge utility that combines local and remote carts without dropping any item
function mergeCartItems(local: CartItem[], remote: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>();

  const getCleanItem = (i: any): CartItem => ({
    id: i.id || i.slug,
    slug: i.slug || i.id,
    name: i.name || 'Artisanal Creation',
    price_kobo: typeof i.price_kobo === 'number' ? i.price_kobo : 0,
    image_url: i.image_url || '/product-lamour.jpg',
    qty: Math.max(1, typeof i.qty === 'number' ? i.qty : 1),
  });

  // 1. Add all local items
  (Array.isArray(local) ? local : []).forEach((item) => {
    if (!item) return;
    const clean = getCleanItem(item);
    const key = clean.slug || clean.id;
    map.set(key, clean);
  });

  // 2. Merge remote items
  (Array.isArray(remote) ? remote : []).forEach((rItem) => {
    if (!rItem) return;
    const cleanRemote = getCleanItem(rItem);
    const key = cleanRemote.slug || cleanRemote.id;
    if (map.has(key)) {
      const existing = map.get(key)!;
      existing.qty = Math.max(existing.qty, cleanRemote.qty);
      if (!existing.image_url && cleanRemote.image_url) existing.image_url = cleanRemote.image_url;
      if (!existing.name && cleanRemote.name) existing.name = cleanRemote.name;
      if (!existing.price_kobo && cleanRemote.price_kobo) existing.price_kobo = cleanRemote.price_kobo;
    } else {
      map.set(key, cleanRemote);
    }
  });

  return Array.from(map.values());
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<CartItem | null>(null);
  const [mounted, setMounted] = useState(false);

  // Synchronously resolve active user ID from state or persistent storage
  const getResolvedUserId = useCallback((): string | null => {
    if (user?.id) return user.id;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('aroma_active_user') || localStorage.getItem('aroma_demo_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.id) return parsed.id;
        }
      } catch {}
    }
    return null;
  }, [user]);

  const activeUserId = getResolvedUserId();
  const lastMutationTimeRef = useRef<number>(0);

  // Immediate synchronous helper to persist cart to localStorage
  const saveCartToStorage = useCallback(
    (newItems: CartItem[]) => {
      if (typeof window === 'undefined') return;
      try {
        const currentUid = getResolvedUserId();
        const storageKey = currentUid ? `aroma_cart_${currentUid}` : GUEST_STORAGE_KEY;
        localStorage.setItem(storageKey, JSON.stringify(newItems));
      } catch (e) {
        console.warn('Failed to persist cart to storage:', e);
      }
    },
    [getResolvedUserId]
  );

  // Sync cart to server for signed-in user
  const syncToServer = useCallback(
    async (userId: string, cartItems: CartItem[]) => {
      if (!userId) return;
      lastMutationTimeRef.current = Date.now();
      try {
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, items: cartItems }),
        });
      } catch (err) {
        console.warn('Failed to sync cart to server:', err);
      }
    },
    []
  );

  // Fetch cart from server
  const fetchFromServer = useCallback(async (userId: string): Promise<CartItem[] | null> => {
    if (!userId) return null;
    try {
      const res = await fetch(`/api/cart?userId=${encodeURIComponent(userId)}`, {
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const data = await res.json();
      return Array.isArray(data.items) ? data.items : [];
    } catch {
      return null;
    }
  }, []);

  // Initial load on mount or when user account transitions
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;

    async function loadCart() {
      try {
        const currentUid = getResolvedUserId();
        const userKey = currentUid ? `aroma_cart_${currentUid}` : null;
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
              loadedItems = mergeCartItems(loadedItems, parsedGuest);
              localStorage.removeItem(GUEST_STORAGE_KEY);
              localStorage.setItem(userKey, JSON.stringify(loadedItems));
            } else if (loadedItems.length === 0) {
              loadedItems = parsedGuest;
            }
          }
        }

        // Display locally loaded items immediately (zero blank screen / zero empty flash)
        if (isMounted && loadedItems.length > 0) {
          setItems(loadedItems);
        }

        // If user is logged in, sync with remote server cart
        if (currentUid) {
          const remoteItems = await fetchFromServer(currentUid);
          if (remoteItems && isMounted) {
            let finalItems: CartItem[];
            if (remoteItems.length > 0) {
              finalItems = mergeCartItems(loadedItems, remoteItems);
            } else {
              // Remote is empty, keep local items
              finalItems = loadedItems;
            }

            if (finalItems.length > 0) {
              saveCartToStorage(finalItems);
              syncToServer(currentUid, finalItems);
              setItems(finalItems);
            } else if (loadedItems.length === 0) {
              setItems([]);
            }
          }
        } else if (isMounted && loadedItems.length === 0) {
          setItems([]);
        }
      } catch (err) {
        console.warn('Error reading cart:', err);
      } finally {
        if (isMounted) setMounted(true);
      }
    }

    loadCart();

    return () => {
      isMounted = false;
    };
  }, [activeUserId, fetchFromServer, getResolvedUserId, saveCartToStorage, syncToServer]);

  // Real-time synchronization polling & visibility change listener
  useEffect(() => {
    if (!activeUserId || typeof window === 'undefined') return;

    let isSubscribed = true;

    const pullLatestCart = async () => {
      if (document.hidden) return;
      // Skip if user recently performed an action locally (prevent race conditions)
      if (Date.now() - lastMutationTimeRef.current < 2500) return;

      const remote = await fetchFromServer(activeUserId);
      if (!remote || !isSubscribed) return;

      setItems((prev) => {
        // If remote returned items, merge safely
        if (remote.length > 0) {
          const merged = mergeCartItems(prev, remote);
          const prevKey = JSON.stringify(prev.map(i => ({ id: i.id, qty: i.qty })));
          const nextKey = JSON.stringify(merged.map(i => ({ id: i.id, qty: i.qty })));
          if (prevKey !== nextKey) {
            saveCartToStorage(merged);
            return merged;
          }
        }
        return prev;
      });
    };

    const interval = setInterval(pullLatestCart, 4000);
    const onVisibilityOrFocus = () => pullLatestCart();

    window.addEventListener('visibilitychange', onVisibilityOrFocus);
    window.addEventListener('focus', onVisibilityOrFocus);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      window.removeEventListener('visibilitychange', onVisibilityOrFocus);
      window.removeEventListener('focus', onVisibilityOrFocus);
    };
  }, [activeUserId, fetchFromServer, saveCartToStorage]);


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
        if (activeUserId) {
          syncToServer(activeUserId, nextList);
        }
        return nextList;
      });

      // Always automatically open the cart sidebar so user sees immediate feedback
      setIsOpen(true);
    },
    [activeUserId, saveCartToStorage, syncToServer]
  );

  // Remove Item
  const removeItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const currentList = Array.isArray(prev) ? prev : [];
        const nextList = currentList.filter((i) => i.id !== id);
        saveCartToStorage(nextList);
        if (activeUserId) {
          syncToServer(activeUserId, nextList);
        }
        return nextList;
      });
    },
    [activeUserId, saveCartToStorage, syncToServer]
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
        if (activeUserId) {
          syncToServer(activeUserId, nextList);
        }
        return nextList;
      });
    },
    [activeUserId, saveCartToStorage, syncToServer]
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
          fetch(`/api/cart?userId=${encodeURIComponent(activeUserId)}`, { method: 'DELETE' }).catch(() => {});
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
  const distinctItems = items.length;
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
        distinctItems,
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

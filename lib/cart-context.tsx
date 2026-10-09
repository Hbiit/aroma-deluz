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

// A cart line can be addressed by product id (uuid) or by slug — accept either.
// Server rows carry both, while the UI passes `item.id`, so matching on only
// one of the two silently makes ±/remove a no-op.
function matchesCartItem(item: CartItem, id: string): boolean {
  return item.id === id || (!!item.slug && item.slug === id);
}

// Stable identity for a cart line (slug when available, otherwise id).
function cartKey(item: CartItem): string {
  return (item.slug || item.id || '').toString();
}

function sameCartLine(a: CartItem, b: CartItem): boolean {
  return cartKey(a) === cartKey(b);
}

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

  // Mirror of `items` so mutators can compute the next cart synchronously
  // without doing side effects inside a React state updater (React may invoke
  // an updater more than once, which would double every server write).
  const itemsRef = useRef<CartItem[]>([]);
  useEffect(() => {
    itemsRef.current = Array.isArray(items) ? items : [];
  }, [items]);

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

  const performGranularSync = useCallback(
    async (userId: string, action: 'add' | 'remove' | 'update', item: any) => {
      if (!userId) return;
      // Register the mutation time so the polling loop cannot overwrite this
      // change with a snapshot that is still in flight.
      lastMutationTimeRef.current = Date.now();
      try {
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, action, item }),
        });
      } catch (err) {
        console.warn(`Failed to perform ${action} on server:`, err);
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
        let storedItems: CartItem[] = [];

        if (userKey) {
          const stored = localStorage.getItem(userKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) storedItems = parsed.filter(Boolean);
          }
        }

        // Cart built while signed out. It is a one-shot migration: it may only
        // be pushed *up* to the account, never used to re-add items the account
        // has already removed elsewhere.
        let guestItems: CartItem[] = [];
        const guestStored = localStorage.getItem(GUEST_STORAGE_KEY);
        if (guestStored) {
          const parsedGuest = JSON.parse(guestStored);
          if (Array.isArray(parsedGuest)) guestItems = parsedGuest.filter(Boolean);
        }

        if (!currentUid) {
          if (isMounted) setItems(storedItems.length > 0 ? storedItems : guestItems);
          return;
        }

        // Show the cached cart instantly (zero blank screen / zero empty flash)
        const cachedItems = mergeCartItems(storedItems, guestItems);
        if (isMounted && cachedItems.length > 0) {
          setItems(cachedItems);
        }

        const remoteItems = await fetchFromServer(currentUid);
        if (!remoteItems || !isMounted) return; // server unreachable — keep the cached cart

        // The account cart lives on the server. Anything the server no longer
        // carries was removed on another device (e.g. the mobile app), so a
        // reload must never union it back in — that is what made removals made
        // on the phone reappear here and on the phone. Only the signed-out
        // guest cart is migrated, via explicit per-item adds.
        const pendingGuest = guestItems.filter(
          (g) => !remoteItems.some((r) => sameCartLine(r, g))
        );
        if (pendingGuest.length > 0) {
          localStorage.removeItem(GUEST_STORAGE_KEY);
          for (const g of pendingGuest) {
            performGranularSync(currentUid, 'add', {
              id: g.id || g.slug,
              slug: g.slug,
              qty: Math.max(1, g.qty || 1),
            });
          }
        }

        const finalItems = mergeCartItems(remoteItems, pendingGuest);
        saveCartToStorage(finalItems);
        setItems(finalItems);
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
  }, [activeUserId, fetchFromServer, getResolvedUserId, saveCartToStorage, performGranularSync]);

  // Real-time synchronization polling & visibility change listener
  useEffect(() => {
    if (!activeUserId || typeof window === 'undefined') return;

    let isSubscribed = true;

    const pullLatestCart = async () => {
      if (document.hidden) return;
      // Skip if user recently performed an action locally (prevent race conditions)
      if (Date.now() - lastMutationTimeRef.current < 2500) return;

      const mutationAtStart = lastMutationTimeRef.current;
      const remote = await fetchFromServer(activeUserId);
      if (!remote || !isSubscribed) return;
      // A local change landed while this snapshot was in flight — it is stale,
      // so applying it would undo the change the user just made.
      if (lastMutationTimeRef.current !== mutationAtStart) return;

      setItems((prev) => {
        // If remote is an array (even empty), it represents the true server state
        const prevKey = JSON.stringify(prev.map(i => ({ id: i.id, qty: i.qty })));
        const nextKey = JSON.stringify(remote.map(i => ({ id: i.id, qty: i.qty })));
        
        if (prevKey !== nextKey) {
          saveCartToStorage(remote);
          return remote;
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

      const currentList = Array.isArray(itemsRef.current) ? itemsRef.current : [];
      const existingIndex = currentList.findIndex(
        (i) => i.id === item.id || (item.slug && i.slug === item.slug)
      );

      const nextList: CartItem[] =
        existingIndex > -1
          ? currentList.map((i, idx) =>
              idx === existingIndex ? { ...i, qty: i.qty + count } : i
            )
          : [...currentList, targetItem];

      itemsRef.current = nextList;
      setItems(nextList);
      saveCartToStorage(nextList);
      if (activeUserId) {
        performGranularSync(activeUserId, 'add', { id: targetItem.id, qty: count });
      }

      // Always automatically open the cart sidebar so user sees immediate feedback
      setIsOpen(true);
    },
    [activeUserId, saveCartToStorage, performGranularSync]
  );

  // Remove Item
  const removeItem = useCallback(
    (id: string) => {
      const currentList = Array.isArray(itemsRef.current) ? itemsRef.current : [];
      const targetItem = currentList.find((i) => matchesCartItem(i, id));
      if (!targetItem) return;

      const nextList = currentList.filter((i) => !matchesCartItem(i, id));
      itemsRef.current = nextList;
      setItems(nextList);
      saveCartToStorage(nextList);
      if (activeUserId) {
        performGranularSync(activeUserId, 'remove', { id: targetItem.id });
      }
    },
    [activeUserId, saveCartToStorage, performGranularSync]
  );

  // Update Item Quantity
  const updateQty = useCallback(
    (id: string, delta: number) => {
      const currentList = Array.isArray(itemsRef.current) ? itemsRef.current : [];
      const targetItem = currentList.find((i) => matchesCartItem(i, id));
      if (!targetItem) return;

      const newQty = targetItem.qty + delta;
      const nextList = currentList
        .map((i) => (matchesCartItem(i, id) ? { ...i, qty: newQty } : i))
        .filter((i) => i.qty > 0);

      itemsRef.current = nextList;
      setItems(nextList);
      saveCartToStorage(nextList);
      if (activeUserId) {
        if (newQty <= 0) {
          performGranularSync(activeUserId, 'remove', { id: targetItem.id });
        } else {
          performGranularSync(activeUserId, 'update', { id: targetItem.id, qty: newQty });
        }
      }
    },
    [activeUserId, saveCartToStorage, performGranularSync]
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
    itemsRef.current = [];
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

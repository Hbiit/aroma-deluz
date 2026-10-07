import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { CartItem } from '../types';
import { useAuth } from './AuthContext';
import { getUserCart, saveUserCart, clearUserCart as deleteUserCartApi } from '../services/api';

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
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  syncNow: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

const GUEST_STORAGE_KEY = 'aroma_mobile_guest_cart';
const STORAGE_USER_KEY = 'aroma_mobile_user';

function mergeCartItems(a: CartItem[], b: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>();
  for (const item of [...a, ...b]) {
    if (!item) continue;
    const key = (item.slug || item.id || '').toString();
    if (!key) continue;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...item, qty: Math.max(1, item.qty || 1) });
    } else {
      map.set(key, {
        ...existing,
        ...item,
        qty: Math.max(existing.qty || 1, item.qty || 1),
      });
    }
  }
  return Array.from(map.values());
}

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [cachedUserId, setCachedUserId] = useState<string | null>(null);

  // Read stored user ID immediately to prevent guest cart fallback during auth resolution
  useEffect(() => {
    if (user?.id) {
      setCachedUserId(user.id);
    } else {
      AsyncStorage.getItem(STORAGE_USER_KEY).then(saved => {
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed?.id) setCachedUserId(parsed.id);
          } catch (_) {}
        }
      }).catch(() => {});
    }
  }, [user?.id]);

  const effectiveUserId = user?.id || cachedUserId || null;
  const prevUserIdRef = useRef<string | null>(null);
  const lastMutationTimeRef = useRef<number>(0);
  const itemsRef = useRef<CartItem[]>(items);
  itemsRef.current = items;

  // Local storage helper
  const saveToLocalStorage = useCallback(async (cartItems: CartItem[], forUserId: string | null = effectiveUserId) => {
    try {
      const key = forUserId ? `aroma_cart_${forUserId}` : GUEST_STORAGE_KEY;
      const dataStr = JSON.stringify(cartItems);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        localStorage.setItem(key, dataStr);
      } else {
        await AsyncStorage.setItem(key, dataStr);
      }
    } catch (e) {
      console.warn('Failed to save to local mobile storage', e);
    }
  }, [effectiveUserId]);

  const loadFromLocalStorage = useCallback(async (forUserId: string | null = effectiveUserId): Promise<CartItem[]> => {
    try {
      const key = forUserId ? `aroma_cart_${forUserId}` : GUEST_STORAGE_KEY;
      let dataStr: string | null = null;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        dataStr = localStorage.getItem(key);
      } else {
        dataStr = await AsyncStorage.getItem(key);
      }
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to read from local mobile storage', e);
    }
    return [];
  }, [effectiveUserId]);

  // Sync to server API
  const pushToServer = useCallback(async (userId: string, cartItems: CartItem[]) => {
    if (!userId) return;
    lastMutationTimeRef.current = Date.now();
    setIsSyncing(true);
    try {
      await saveUserCart(userId, cartItems);
      setLastSyncedAt(new Date());
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Sync from server API
  const pullFromServer = useCallback(async (userId: string) => {
    if (!userId) return;
    // Skip if user recently performed an action locally (debounce race conditions)
    if (Date.now() - lastMutationTimeRef.current < 2500) return;

    try {
      const remoteItems = await getUserCart(userId);
      const current = itemsRef.current;

      // If remote returned empty but user has local items, do NOT wipe local cart!
      // Instead, save local items back to server to repair server state
      if ((!remoteItems || remoteItems.length === 0) && current.length > 0) {
        pushToServer(userId, current).catch(() => {});
        return;
      }

      // Merge current items with remote items to guarantee zero item loss
      const merged = mergeCartItems(current, remoteItems || []);

      const currentKey = JSON.stringify(current.map(i => ({ id: i.slug || i.id, qty: i.qty })));
      const mergedKey = JSON.stringify(merged.map(i => ({ id: i.slug || i.id, qty: i.qty })));

      if (currentKey !== mergedKey) {
        setItems(merged);
        saveToLocalStorage(merged, userId);
        setLastSyncedAt(new Date());

        const remoteKey = JSON.stringify((remoteItems || []).map(i => ({ id: i.slug || i.id, qty: i.qty })));
        if (mergedKey !== remoteKey) {
          pushToServer(userId, merged).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Failed pulling cart from server:', err);
    }
  }, [pushToServer, saveToLocalStorage]);

  // Handle auth changes and initialization
  useEffect(() => {
    let mounted = true;
    const prevUserId = prevUserIdRef.current;
    prevUserIdRef.current = effectiveUserId;

    async function syncCartOnAuthChange() {
      try {
        if (!effectiveUserId) {
          // GUEST MODE:
          if (prevUserId !== null) {
            // User just explicitly logged out
            if (mounted) setItems([]);
          } else {
            // App launched as guest — load any existing guest cart
            const guestCart = await loadFromLocalStorage(null);
            if (mounted) setItems(guestCart);
          }
          return;
        }

        // AUTHENTICATED MODE:
        setIsSyncing(true);

        // 1. Check for temporary guest items to merge
        const guestItems = await loadFromLocalStorage(null);

        // 2. Load locally cached cart for instant display (no blank screen or flicker)
        const cachedUserCart = await loadFromLocalStorage(effectiveUserId);
        if (cachedUserCart.length > 0 && mounted) {
          setItems(cachedUserCart);
        }

        // 3. Fetch canonical cart from backend
        let remoteItems: CartItem[] = [];
        try {
          remoteItems = await getUserCart(effectiveUserId);
        } catch (e) {
          console.warn('Remote cart fetch notice:', e);
        }
        if (!mounted) return;

        // Merge cachedUserCart and remoteItems
        let finalItems = mergeCartItems(cachedUserCart, remoteItems);

        // Merge any guest cart items created before authentication
        if (guestItems.length > 0) {
          finalItems = mergeCartItems(finalItems, guestItems);

          // Clear guest storage after successful merge
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            localStorage.removeItem(GUEST_STORAGE_KEY);
          } else {
            await AsyncStorage.removeItem(GUEST_STORAGE_KEY).catch(() => {});
          }
        }

        // Push merged state up to server if items exist
        if (finalItems.length > 0) {
          await pushToServer(effectiveUserId, finalItems);
        }

        if (mounted) {
          setItems(finalItems);
          saveToLocalStorage(finalItems, effectiveUserId);
          setLastSyncedAt(new Date());
        }
      } catch (err) {
        console.warn('Error synchronizing mobile cart on auth change:', err);
      } finally {
        if (mounted) setIsSyncing(false);
      }
    }

    syncCartOnAuthChange();

    return () => {
      mounted = false;
    };
  }, [effectiveUserId, loadFromLocalStorage, pushToServer, saveToLocalStorage]);

  // Real-time synchronization interval when logged in
  useEffect(() => {
    if (!effectiveUserId) return;

    const interval = setInterval(() => {
      pullFromServer(effectiveUserId);
    }, 3000); // Check every 3 seconds for instant bidirectional sync

    return () => clearInterval(interval);
  }, [effectiveUserId, pullFromServer]);

  // Add Item
  const addItem = useCallback(
    (item: Omit<CartItem, 'qty'>, qty: number = 1) => {
      lastMutationTimeRef.current = Date.now();
      const count = Math.max(1, qty);
      const target: CartItem = {
        id: item.id,
        slug: item.slug || item.id,
        name: item.name,
        price_kobo: item.price_kobo,
        image_url: item.image_url,
        qty: count,
      };

      setItems(prev => {
        const list = Array.isArray(prev) ? prev : [];
        const index = list.findIndex(i => i.id === item.id || (item.slug && i.slug === item.slug));
        let updated: CartItem[];
        if (index > -1) {
          updated = list.map((it, idx) => (idx === index ? { ...it, qty: it.qty + count } : it));
        } else {
          updated = [...list, target];
        }

        saveToLocalStorage(updated, effectiveUserId);
        if (effectiveUserId) {
          pushToServer(effectiveUserId, updated);
        }
        return updated;
      });
    },
    [effectiveUserId, pushToServer, saveToLocalStorage]
  );

  // Remove Item
  const removeItem = useCallback(
    (id: string) => {
      lastMutationTimeRef.current = Date.now();
      setItems(prev => {
        const list = Array.isArray(prev) ? prev : [];
        const updated = list.filter(i => i.id !== id && i.slug !== id);
        saveToLocalStorage(updated, effectiveUserId);
        if (effectiveUserId) {
          pushToServer(effectiveUserId, updated);
        }
        return updated;
      });
    },
    [effectiveUserId, pushToServer, saveToLocalStorage]
  );

  // Update Quantity
  const updateQty = useCallback(
    (id: string, delta: number) => {
      lastMutationTimeRef.current = Date.now();
      setItems(prev => {
        const list = Array.isArray(prev) ? prev : [];
        const updated = list
          .map(i => ((i.id === id || i.slug === id) ? { ...i, qty: i.qty + delta } : i))
          .filter(i => i.qty > 0);

        saveToLocalStorage(updated, effectiveUserId);
        if (effectiveUserId) {
          pushToServer(effectiveUserId, updated);
        }
        return updated;
      });
    },
    [effectiveUserId, pushToServer, saveToLocalStorage]
  );

  // Clear Cart
  const clearCart = useCallback(async () => {
    lastMutationTimeRef.current = Date.now();
    setItems([]);
    if (effectiveUserId) {
      deleteUserCartApi(effectiveUserId).catch(() => {});
      const key = `aroma_cart_${effectiveUserId}`;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        localStorage.removeItem(key);
      } else {
        AsyncStorage.removeItem(key).catch(() => {});
      }
    } else {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        localStorage.removeItem(GUEST_STORAGE_KEY);
      } else {
        AsyncStorage.removeItem(GUEST_STORAGE_KEY).catch(() => {});
      }
    }
  }, [effectiveUserId]);

  const syncNow = useCallback(async () => {
    if (effectiveUserId) {
      await pullFromServer(effectiveUserId);
    }
  }, [effectiveUserId, pullFromServer]);

  const totalItems = items.reduce((sum, i) => sum + (i.qty || 1), 0);
  const distinctItems = items.length;
  const totalKobo = items.reduce((sum, i) => sum + (i.price_kobo || 0) * (i.qty || 1), 0);
  const totalFormatted = `₦${(totalKobo / 100).toLocaleString('en-NG')}`;

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
        totalAmount: totalKobo,
        totalFormatted,
        isSyncing,
        lastSyncedAt,
        syncNow,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};

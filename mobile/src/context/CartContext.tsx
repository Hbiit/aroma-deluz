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
  totalKobo: number;
  totalFormatted: string;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  syncNow: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

const GUEST_STORAGE_KEY = 'aroma_mobile_guest_cart';

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const activeUserId = user?.id || null;
  const itemsRef = useRef<CartItem[]>(items);
  itemsRef.current = items;

  // Local storage helper
  const saveToLocalStorage = useCallback(async (cartItems: CartItem[]) => {
    try {
      const key = activeUserId ? `aroma_cart_${activeUserId}` : GUEST_STORAGE_KEY;
      const dataStr = JSON.stringify(cartItems);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        localStorage.setItem(key, dataStr);
      } else {
        await AsyncStorage.setItem(key, dataStr);
      }
    } catch (e) {
      console.warn('Failed to save to local mobile storage', e);
    }
  }, [activeUserId]);

  const loadFromLocalStorage = useCallback(async (): Promise<CartItem[]> => {
    try {
      const key = activeUserId ? `aroma_cart_${activeUserId}` : GUEST_STORAGE_KEY;
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
  }, [activeUserId]);

  // Sync to server API
  const pushToServer = useCallback(async (userId: string, cartItems: CartItem[]) => {
    if (!userId) return;
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
    try {
      const remoteItems = await getUserCart(userId);
      const current = itemsRef.current;
      const currentKey = JSON.stringify(current.map(i => ({ id: i.id, qty: i.qty })));
      const remoteKey = JSON.stringify(remoteItems.map(i => ({ id: i.id, qty: i.qty })));

      if (currentKey !== remoteKey) {
        setItems(remoteItems);
        saveToLocalStorage(remoteItems);
        setLastSyncedAt(new Date());
      }
    } catch (err) {
      console.warn('Failed pulling cart from server:', err);
    }
  }, [saveToLocalStorage]);

  // Initial load when user or mount changes
  useEffect(() => {
    let mounted = true;

    async function init() {
      const local = await loadFromLocalStorage();
      if (!mounted) return;

      if (activeUserId) {
        setIsSyncing(true);
        try {
          const remote = await getUserCart(activeUserId);
          if (mounted) {
            let finalItems = local;
            if (remote.length > 0 && local.length === 0) {
              finalItems = remote;
            } else if (remote.length > 0 && local.length > 0) {
              // Merge items
              const map = new Map<string, CartItem>();
              local.forEach(i => map.set(i.id, { ...i }));
              remote.forEach(r => {
                if (map.has(r.id)) {
                  map.get(r.id)!.qty = Math.max(map.get(r.id)!.qty, r.qty);
                } else {
                  map.set(r.id, r);
                }
              });
              finalItems = Array.from(map.values());
            } else if (local.length > 0 && remote.length === 0) {
              // Push local to remote
              pushToServer(activeUserId, local);
              finalItems = local;
            }
            setItems(finalItems);
            saveToLocalStorage(finalItems);
            setLastSyncedAt(new Date());
          }
        } finally {
          if (mounted) setIsSyncing(false);
        }
      } else {
        setItems(local);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [activeUserId, loadFromLocalStorage, pushToServer, saveToLocalStorage]);

  // Real-time synchronization interval when logged in
  useEffect(() => {
    if (!activeUserId) return;

    const interval = setInterval(() => {
      pullFromServer(activeUserId);
    }, 3000); // Check every 3 seconds for instant bidirectional sync

    return () => clearInterval(interval);
  }, [activeUserId, pullFromServer]);

  // Add Item
  const addItem = useCallback(
    (item: Omit<CartItem, 'qty'>, qty: number = 1) => {
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
        const index = list.findIndex(i => i.id === item.id);
        let updated: CartItem[];
        if (index > -1) {
          updated = list.map((it, idx) => (idx === index ? { ...it, qty: it.qty + count } : it));
        } else {
          updated = [...list, target];
        }

        saveToLocalStorage(updated);
        if (activeUserId) {
          pushToServer(activeUserId, updated);
        }
        return updated;
      });
    },
    [activeUserId, pushToServer, saveToLocalStorage]
  );

  // Remove Item
  const removeItem = useCallback(
    (id: string) => {
      setItems(prev => {
        const list = Array.isArray(prev) ? prev : [];
        const updated = list.filter(i => i.id !== id);
        saveToLocalStorage(updated);
        if (activeUserId) {
          pushToServer(activeUserId, updated);
        }
        return updated;
      });
    },
    [activeUserId, pushToServer, saveToLocalStorage]
  );

  // Update Quantity
  const updateQty = useCallback(
    (id: string, delta: number) => {
      setItems(prev => {
        const list = Array.isArray(prev) ? prev : [];
        const updated = list
          .map(i => (i.id === id ? { ...i, qty: i.qty + delta } : i))
          .filter(i => i.qty > 0);

        saveToLocalStorage(updated);
        if (activeUserId) {
          pushToServer(activeUserId, updated);
        }
        return updated;
      });
    },
    [activeUserId, pushToServer, saveToLocalStorage]
  );

  // Clear Cart
  const clearCart = useCallback(async () => {
    setItems([]);
    if (activeUserId) {
      deleteUserCartApi(activeUserId).catch(() => {});
      const key = `aroma_cart_${activeUserId}`;
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
  }, [activeUserId]);

  const syncNow = useCallback(async () => {
    if (activeUserId) {
      await pullFromServer(activeUserId);
    }
  }, [activeUserId, pullFromServer]);

  const totalItems = items.reduce((sum, i) => sum + (i.qty || 1), 0);
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
        totalKobo,
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

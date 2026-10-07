'use client';

import { createContext, useContext, useEffect, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isDemo: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signInWithGoogle: (nextTarget?: string) => Promise<{ error?: string }>;
  updateProfile: (data: Partial<AuthUser>) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_ACTIVE_USER_KEY = 'aroma_active_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_ACTIVE_USER_KEY) || localStorage.getItem('aroma_demo_user');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();

    if (!supabase) {
      // Demo Mode: Restore simulated user from localStorage if present
      setIsDemo(true);
      const stored = localStorage.getItem('aroma_demo_user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          localStorage.removeItem('aroma_demo_user');
        }
      }
      setLoading(false);
      return;
    }

    // Live Supabase Mode
    setIsDemo(false);

    // 1. Restore from active user cache first if available
    const cachedStr = localStorage.getItem(STORAGE_ACTIVE_USER_KEY);
    if (cachedStr) {
      try {
        const parsed = JSON.parse(cachedStr);
        if (parsed?.id) {
          setUser(parsed);
        }
      } catch {}
    }

    // 2. Fetch session from Supabase
    supabase.auth.getSession().then((res: any) => {
      const session = res?.data?.session;
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        const activeUser: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          fullName: meta.full_name || session.user.email?.split('@')[0],
          avatarUrl: meta.avatar_url,
          phone: meta.phone || '',
          address: meta.address || '',
          city: meta.city || 'Lagos',
          state: meta.state || 'Lagos',
        };
        setUser(activeUser);
        localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(activeUser));
      } else if (!cachedStr) {
        setUser(null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      startTransition(() => {
        if (session?.user) {
          const meta = session.user.user_metadata || {};
          const activeUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            fullName: meta.full_name || session.user.email?.split('@')[0],
            avatarUrl: meta.avatar_url,
            phone: meta.phone || '',
            address: meta.address || '',
            city: meta.city || 'Lagos',
            state: meta.state || 'Lagos',
          };
          setUser(activeUser);
          localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(activeUser));
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem(STORAGE_ACTIVE_USER_KEY);
          localStorage.removeItem('aroma_demo_user');
        }
        setLoading(false);
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string): Promise<{ error?: string }> => {
    const supabase = createClient();
    if (!supabase) {
      // Demo Mode simulation
      if (!email || !password) return { error: 'Please enter both email and password.' };
      const demoUser: AuthUser = {
        id: 'demo-user-123',
        email,
        fullName: email.split('@')[0].replace('.', ' '),
        phone: '08012345678',
        address: '12 Victoria Island',
        city: 'Lagos',
        state: 'Lagos',
      };
      localStorage.setItem('aroma_demo_user', JSON.stringify(demoUser));
      localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(demoUser));
      setUser(demoUser);
      return {};
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (data?.user) {
      const meta = data.user.user_metadata || {};
      const activeUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || '',
        fullName: meta.full_name || data.user.email?.split('@')[0],
        avatarUrl: meta.avatar_url,
        phone: meta.phone || '',
        address: meta.address || '',
        city: meta.city || 'Lagos',
        state: meta.state || 'Lagos',
      };
      setUser(activeUser);
      localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(activeUser));
    }
    return {};
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string): Promise<{ error?: string }> => {
    const supabase = createClient();
    if (!supabase) {
      // Demo Mode simulation
      if (!email || !password) return { error: 'Please fill in all required fields.' };
      const demoUser: AuthUser = {
        id: 'demo-user-' + Date.now(),
        email,
        fullName: fullName || email.split('@')[0],
        phone: '08012345678',
        address: '12 Victoria Island',
        city: 'Lagos',
        state: 'Lagos',
      };
      localStorage.setItem('aroma_demo_user', JSON.stringify(demoUser));
      setUser(demoUser);
      return {};
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) return { error: error.message };
    if (data?.user) {
      const activeUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || email,
        fullName: fullName || email.split('@')[0],
      };
      setUser(activeUser);
      localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(activeUser));
    }
    return {};
  };

  const signInWithGoogle = async (nextTarget: string = '/checkout'): Promise<{ error?: string }> => {
    const supabase = createClient();
    if (!supabase) {
      // Demo Mode simulation
      const demoUser: AuthUser = {
        id: 'demo-google-user',
        email: 'client@gmail.com',
        fullName: 'Aroma Connoisseur',
        phone: '08012345678',
        address: '12 Victoria Island',
        city: 'Lagos',
        state: 'Lagos',
      };
      localStorage.setItem('aroma_demo_user', JSON.stringify(demoUser));
      localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(demoUser));
      setUser(demoUser);
      return {};
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextTarget)}`,
      },
    });
    if (error) return { error: error.message };
    return {};
  };

  const updateProfile = async (data: Partial<AuthUser>): Promise<{ error?: string }> => {
    const supabase = createClient();
    if (!supabase || isDemo) {
      if (!user) return { error: 'No active session.' };
      const updated = { ...user, ...data };
      setUser(updated);
      localStorage.setItem('aroma_demo_user', JSON.stringify(updated));
      localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(updated));
      return {};
    }

    const metadataUpdate: Record<string, any> = {};
    if (data.fullName !== undefined) metadataUpdate.full_name = data.fullName;
    if (data.phone !== undefined) metadataUpdate.phone = data.phone;
    if (data.address !== undefined) metadataUpdate.address = data.address;
    if (data.city !== undefined) metadataUpdate.city = data.city;
    if (data.state !== undefined) metadataUpdate.state = data.state;

    const { error } = await supabase.auth.updateUser({
      data: metadataUpdate,
    });

    if (error) return { error: error.message };

    setUser((prev) => {
      const next = prev ? { ...prev, ...data } : null;
      if (next) localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(next));
      return next;
    });
    return {};
  };

  const signOut = async () => {
    const supabase = createClient();
    localStorage.removeItem(STORAGE_ACTIVE_USER_KEY);
    localStorage.removeItem('aroma_demo_user');
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemo,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        updateProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

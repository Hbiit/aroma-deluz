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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
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
    supabase.auth.getUser().then(({ data: { user: sbUser } }) => {
      if (sbUser) {
        const meta = sbUser.user_metadata || {};
        setUser({
          id: sbUser.id,
          email: sbUser.email || '',
          fullName: meta.full_name || sbUser.email?.split('@')[0],
          avatarUrl: meta.avatar_url,
          phone: meta.phone || '',
          address: meta.address || '',
          city: meta.city || 'Lagos',
          state: meta.state || 'Lagos',
        });
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      startTransition(() => {
        if (session?.user) {
          const meta = session.user.user_metadata || {};
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            fullName: meta.full_name || session.user.email?.split('@')[0],
            avatarUrl: meta.avatar_url,
            phone: meta.phone || '',
            address: meta.address || '',
            city: meta.city || 'Lagos',
            state: meta.state || 'Lagos',
          });
        } else {
          setUser(null);
        }
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
      setUser(demoUser);
      return {};
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
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

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) return { error: error.message };
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

    setUser((prev) => (prev ? { ...prev, ...data } : null));
    return {};
  };

  const signOut = async () => {
    const supabase = createClient();
    if (!supabase) {
      localStorage.removeItem('aroma_demo_user');
      setUser(null);
      return;
    }

    await supabase.auth.signOut();
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

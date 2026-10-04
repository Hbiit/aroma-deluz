import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../services/supabase';
import { User } from '../types';

// Complete any pending browser auth sessions (required for web & deep links)
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  getGoogleAuthUrl: () => Promise<{ url?: string; error?: string }>;
  completeGoogleAuth: (params: { access_token?: string; refresh_token?: string; code?: string }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_USER_KEY = '@aroma_active_client';

// Helper to extract session tokens or code from redirect URLs (handles query string and hash fragment)
const extractSessionFromUrl = (url: string): Record<string, string> => {
  const params: Record<string, string> = {};
  if (!url) return params;

  try {
    const [baseAndQuery, hash] = url.split('#');
    const [, query] = baseAndQuery.split('?');

    const parseParams = (str?: string) => {
      if (!str) return;
      str.split('&').forEach((part) => {
        const [k, v] = part.split('=');
        if (k && v !== undefined) {
          params[decodeURIComponent(k)] = decodeURIComponent(v);
        }
      });
    };

    parseParams(query);
    parseParams(hash);
  } catch (err) {
    console.warn('URL parsing notice:', err);
  }

  return params;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore existing session on mount and listen to deep links
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Check native storage
        const saved = await AsyncStorage.getItem(STORAGE_USER_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.email) {
            setUser(parsed);
          }
        }

        // 2. Check Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const activeUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0],
          };
          setUser(activeUser);
          await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(activeUser));
        }
      } catch (e) {
        console.warn('Auth restoration notice:', e);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen to Supabase state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const activeUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0],
        };
        setUser(activeUser);
        AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(activeUser));
      } else if (!user) {
        setUser(null);
      }
      setLoading(false);
    });

    // Handle deep links if the app receives an OAuth callback directly
    const handleDeepLink = async (event: { url: string }) => {
      const callbackUrl = event.url;
      if (!callbackUrl || !callbackUrl.includes('auth/callback')) return;

      try {
        const params = extractSessionFromUrl(callbackUrl);
        if (params.access_token && params.refresh_token) {
          const { data } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (data?.user) {
            const activeUser: User = {
              id: data.user.id,
              email: data.user.email || '',
              name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Valued Client',
            };
            setUser(activeUser);
            await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(activeUser));
          }
        } else if (params.code) {
          const { data } = await supabase.auth.exchangeCodeForSession(params.code);
          if (data?.user) {
            const activeUser: User = {
              id: data.user.id,
              email: data.user.email || '',
              name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Valued Client',
            };
            setUser(activeUser);
            await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(activeUser));
          }
        }
      } catch (err) {
        console.warn('Deep link handling notice:', err);
      }
    };

    const linkingSub = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      listener.subscription.unsubscribe();
      linkingSub.remove();
    };
  }, []);

  // 1. Native In-App Email & Password Sign In
  const signIn = async (email: string, password: string) => {
    const cleanEmail = email.trim();
    try {
      // First attempt native Supabase password sign-in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data.user) {
        const activeUser: User = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          name: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
        };
        setUser(activeUser);
        await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(activeUser));
        return { success: true };
      }

      // If unconfirmed email or local network boundary, authenticate through production endpoint
      const res = await fetch('https://aroma-deluz.vercel.app/api/user/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signin', email: cleanEmail, password }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success && json.user) {
        setUser(json.user);
        await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(json.user));
        return { success: true };
      }

      return { success: false, error: json.error || error?.message || 'Invalid email or password' };
    } catch (err: any) {
      console.warn('Native sign-in fallback:', err);
      return { success: false, error: err?.message || 'Sign in failed. Please check network.' };
    }
  };

  // 2. Native In-App Sign Up (Instant confirmation without localhost redirect)
  const signUp = async (email: string, password: string, name?: string) => {
    const cleanEmail = email.trim();
    const displayName = name?.trim() || cleanEmail.split('@')[0];

    try {
      // Create user via backend service-role API to guarantee instant confirmation
      const res = await fetch('https://aroma-deluz.vercel.app/api/user/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup',
          email: cleanEmail,
          password,
          name: displayName,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success && json.user) {
        await supabase.auth.signInWithPassword({ email: cleanEmail, password }).catch(() => {});
        setUser(json.user);
        await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(json.user));
        return { success: true };
      }

      // Fallback to Supabase direct sign up
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { full_name: displayName },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const activeUser: User = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          name: displayName,
        };
        setUser(activeUser);
        await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(activeUser));
        return { success: true };
      }

      return { success: false, error: json.error || 'Failed to create account' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Registration failed' };
    }
  };

  // 3. Official Google OAuth Sign-In (Real in-app Google authentication)
  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      // On Web browser
      if (Platform.OS === 'web') {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://aroma-deluz.vercel.app';
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${origin}/auth/callback`,
          },
        });
        if (error) return { success: false, error: error.message };
        return { success: true };
      }

      // On Native Mobile (Android APK & iOS)
      const redirectUrl = 'aromadeluz://auth/callback';

      // Request OAuth URL from Supabase with mobile deep link redirect
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data?.url) {
        return { success: false, error: error?.message || 'Could not initiate Google authentication' };
      }

      // Open official Google authentication session inside secure in-app tab
      const authResult = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (authResult.type === 'cancel' || authResult.type === 'dismiss') {
        return { success: false, error: 'Sign in was cancelled' };
      }

      if (authResult.type === 'success' && authResult.url) {
        const params = extractSessionFromUrl(authResult.url);

        // 1. Session Tokens returned in URL fragment
        if (params.access_token && params.refresh_token) {
          const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });

          if (!sessionErr && sessionData.user) {
            const activeUser: User = {
              id: sessionData.user.id,
              email: sessionData.user.email || '',
              name: sessionData.user.user_metadata?.full_name || sessionData.user.user_metadata?.name || sessionData.user.email?.split('@')[0] || 'Valued Client',
            };
            setUser(activeUser);
            await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(activeUser));
            return { success: true };
          }
        }

        // 2. Auth Code returned in URL query
        if (params.code) {
          const { data: codeData, error: codeErr } = await supabase.auth.exchangeCodeForSession(params.code);
          if (!codeErr && codeData.user) {
            const activeUser: User = {
              id: codeData.user.id,
              email: codeData.user.email || '',
              name: codeData.user.user_metadata?.full_name || codeData.user.user_metadata?.name || codeData.user.email?.split('@')[0] || 'Valued Client',
            };
            setUser(activeUser);
            await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(activeUser));
            return { success: true };
          }
        }

        // 3. User details passed in redirect parameters
        if (params.user_id && params.email) {
          const activeUser: User = {
            id: params.user_id,
            email: params.email,
            name: params.name || params.email.split('@')[0] || 'Valued Client',
          };
          setUser(activeUser);
          await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(activeUser));
          return { success: true };
        }

        // 4. Verify existing Supabase session
        const { data: verifySession } = await supabase.auth.getSession();
        if (verifySession.session?.user) {
          const u = verifySession.session.user;
          const activeUser: User = {
            id: u.id,
            email: u.email || '',
            name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Valued Client',
          };
          setUser(activeUser);
          await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(activeUser));
          return { success: true };
        }
      }

      return { success: false, error: 'Google authentication could not be completed' };
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      return { success: false, error: err?.message || 'Google sign-in failed. Please try again.' };
    }
  };

  // 4. Helper to get OAuth URL for in-app Google Auth Modal
  const getGoogleAuthUrl = async (): Promise<{ url?: string; error?: string }> => {
    try {
      const redirectUrl = 'aromadeluz://auth/callback';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data?.url) {
        return { error: error?.message || 'Could not initiate Google authentication' };
      }
      return { url: data.url };
    } catch (e: any) {
      return { error: e?.message || 'Failed to prepare Google authentication' };
    }
  };

  // 5. Complete Google Auth from intercepted tokens (handles localhost:3000, aromadeluz://, or code)
  const completeGoogleAuth = async (params: {
    access_token?: string;
    refresh_token?: string;
    code?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      // 1. If access_token & refresh_token were returned in URL hash fragment
      if (params.access_token && params.refresh_token) {
        const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });

        if (!sessionErr && sessionData.user) {
          const activeUser: User = {
            id: sessionData.user.id,
            email: sessionData.user.email || '',
            name:
              sessionData.user.user_metadata?.full_name ||
              sessionData.user.user_metadata?.name ||
              sessionData.user.email?.split('@')[0] ||
              'Valued Client',
          };
          setUser(activeUser);
          await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(activeUser));
          return { success: true };
        }
      }

      // 2. If authorization code was returned
      if (params.code) {
        const { data: codeData, error: codeErr } = await supabase.auth.exchangeCodeForSession(
          params.code
        );
        if (!codeErr && codeData.user) {
          const activeUser: User = {
            id: codeData.user.id,
            email: codeData.user.email || '',
            name:
              codeData.user.user_metadata?.full_name ||
              codeData.user.user_metadata?.name ||
              codeData.user.email?.split('@')[0] ||
              'Valued Client',
          };
          setUser(activeUser);
          await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(activeUser));
          return { success: true };
        }
      }

      // 3. Fallback: inspect active session
      const { data: verifySession } = await supabase.auth.getSession();
      if (verifySession.session?.user) {
        const u = verifySession.session.user;
        const activeUser: User = {
          id: u.id,
          email: u.email || '',
          name:
            u.user_metadata?.full_name ||
            u.user_metadata?.name ||
            u.email?.split('@')[0] ||
            'Valued Client',
        };
        setUser(activeUser);
        await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(activeUser));
        return { success: true };
      }

      return { success: false, error: 'Could not restore Google user session' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Authentication processing error' };
    } finally {
      setLoading(false);
    }
  };

  // 6. Native Sign Out
  const signOut = async () => {
    await supabase.auth.signOut().catch(() => {});
    await AsyncStorage.removeItem(STORAGE_USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        getGoogleAuthUrl,
        completeGoogleAuth,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items } = useCart();

  const explicitRedirect = searchParams.get('redirect');
  const hasCartItems = items.length > 0 || (typeof window !== 'undefined' && Boolean(localStorage.getItem('aroma_guest_cart')));
  const targetRedirect = explicitRedirect || (hasCartItems ? '/checkout' : '/profile');

  const { signInWithEmail, signUpWithEmail, signInWithGoogle, isDemo } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const res = await signInWithEmail(email, password);
        if (res.error) {
          setError(res.error);
        } else {
          router.push(targetRedirect);
        }
      } else {
        const res = await signUpWithEmail(email, password, fullName);
        if (res.error) {
          setError(res.error);
        } else {
          // Dispatch welcome email asynchronously
          fetch('/api/email/welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, fullName }),
          }).catch((err) => console.error('Welcome email dispatch error:', err));

          // Immediately take user to the payment page to complete order
          router.push(targetRedirect);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await signInWithGoogle(targetRedirect);
      if (res.error) {
        setError(res.error);
      } else if (isDemo) {
        router.push(targetRedirect);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 bg-brand-hero relative">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-darkest/95 via-purple-darkest/90 to-purple-darkest/98" />

      <div className="relative z-10 w-full max-w-[460px] bg-purple-darkest/80 backdrop-blur-xl border border-gold/30 rounded-2xl p-8 sm:p-10 shadow-[0_25px_70px_rgba(0,0,0,0.6)] animate-fade-in-up">
        {/* Brand Logo & Heading */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block group mb-4">
            <Image
              src="/brand-logo.jpg"
              alt="Aroma De Luz"
              width={140}
              height={50}
              className="h-14 w-auto mx-auto object-contain rounded-lg border border-gold/40 shadow-md group-hover:scale-105 transition-transform"
            />
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl text-white font-normal">
            {mode === 'signin' ? 'Welcome Back' : 'Join Aroma De Luz'}
          </h1>
          <p className="text-white/60 text-xs tracking-[0.05em] mt-1 font-light">
            {mode === 'signin'
              ? 'Enter your credentials to access your luxury collection'
              : 'Create an account to track orders and receive bespoke offers'}
          </p>
        </div>

        {/* Demo Mode Notice */}
        {isDemo && (
          <div className="mb-6 px-3.5 py-2 rounded-lg bg-gold/10 border border-gold/30 text-gold text-[0.72rem] flex items-center gap-2">
            <span>✦</span>
            <span>Demo Mode active — test sign-in with any email or Google</span>
          </div>
        )}

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-white/5 rounded-xl border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(null); }}
            className={`py-2.5 text-xs font-semibold tracking-[0.15em] uppercase rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-gold text-purple-darkest shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); }}
            className={`py-2.5 text-xs font-semibold tracking-[0.15em] uppercase rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-gold text-purple-darkest shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error / Success Alerts */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs animate-fade-in flex items-start gap-2">
            <span className="text-red-400">⚠</span>
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-5 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs animate-fade-in flex items-start gap-2">
            <span>✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-white text-xs font-medium tracking-[0.05em] transition-all hover:border-gold/50 disabled:opacity-50 mb-5"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-6">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-purple-darkest px-3 text-[0.68rem] tracking-[0.2em] uppercase text-white/40 absolute">
            or with email
          </span>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-[0.72rem] tracking-[0.1em] uppercase text-white/70 mb-1.5 font-medium">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Amara Okafor"
                required={mode === 'signup'}
                className="w-full px-4 py-3 bg-white/5 border border-white/15 focus:border-gold rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-[0.72rem] tracking-[0.1em] uppercase text-white/70 mb-1.5 font-medium">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/15 focus:border-gold rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none transition-colors"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[0.72rem] tracking-[0.1em] uppercase text-white/70 font-medium">
                Password
              </label>
              {mode === 'signin' && (
                <span className="text-[0.68rem] text-gold/80 hover:text-gold cursor-pointer transition-colors">
                  Forgot?
                </span>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full px-4 py-3 bg-white/5 border border-white/15 focus:border-gold rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-6 bg-gold hover:bg-gold-bright text-purple-darkest font-semibold text-xs tracking-[0.2em] uppercase rounded-xl transition-all duration-300 hover:shadow-[0_8px_25px_rgba(201,164,92,0.35)] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-purple-darkest border-t-transparent rounded-full animate-spin" />
            ) : mode === 'signin' ? (
              'Sign In To Aroma'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer Note */}
        <p className="mt-6 text-center text-white/40 text-[0.72rem]">
          By continuing, you agree to Aroma De Luz&apos;s{' '}
          <Link href="#" className="underline hover:text-gold transition-colors">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="#" className="underline hover:text-gold transition-colors">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center bg-purple-darkest">
          <span className="inline-block w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}

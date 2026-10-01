'use client';

import { useState } from 'react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail('');
    }
  };

  return (
    <div className="w-full md:w-auto min-w-[320px]">
      {submitted ? (
        <div className="bg-gold/15 border border-gold/40 text-gold px-6 py-3 rounded text-sm font-medium animate-fade-in text-center">
          ✓ Welcome to Aroma De Luz. Check your inbox for your 10% welcome gift.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            className="px-5 py-3.5 rounded bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-gold transition-colors text-sm flex-1"
          />
          <button
            type="submit"
            className="bg-gold text-purple-darkest font-semibold text-xs tracking-[0.2em] uppercase px-7 py-3.5 rounded hover:bg-gold-bright transition-colors whitespace-nowrap"
          >
            Subscribe
          </button>
        </form>
      )}
    </div>
  );
}

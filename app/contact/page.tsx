'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'General Inquiry', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-cream py-16 px-4 md:px-8">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-12">
          <p className="text-[0.75rem] uppercase tracking-[0.25em] text-gold font-semibold mb-2">
            Client Concierge & Inquiries
          </p>
          <h1 className="font-serif text-3xl md:text-5xl text-purple-ink">
            How May We Assist You?
          </h1>
          <p className="text-purple-ink/70 text-sm max-w-[480px] mx-auto mt-3 font-light">
            Whether inquiring about bespoke wedding favors, signature corporate scents, or order support, our concierge is at your service.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left: Contact Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-8 border border-gold/15 shadow-sm">
            {submitted ? (
              <div className="py-12 text-center space-y-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-gold/15 text-gold text-2xl flex items-center justify-center mx-auto">
                  ✓
                </div>
                <h3 className="font-serif text-2xl text-purple-ink">Message Received</h3>
                <p className="text-xs text-purple-ink/70 max-w-[360px] mx-auto leading-relaxed">
                  Thank you for reaching out to the Aroma De Luz atelier. Our fragrance specialist will reply to your email within 24 hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 bg-purple-darkest text-white text-xs uppercase tracking-[0.15em] rounded-lg hover:bg-gold hover:text-purple-darkest transition-colors font-semibold"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[0.72rem] tracking-[0.1em] uppercase text-purple-ink/70 font-semibold mb-1.5">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Chioma Eze"
                      className="w-full px-4 py-2.5 bg-ivory border border-gold/25 rounded-lg text-sm text-purple-ink focus:outline-none focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[0.72rem] tracking-[0.1em] uppercase text-purple-ink/70 font-semibold mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@domain.com"
                      className="w-full px-4 py-2.5 bg-ivory border border-gold/25 rounded-lg text-sm text-purple-ink focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[0.72rem] tracking-[0.1em] uppercase text-purple-ink/70 font-semibold mb-1.5">
                    Subject of Inquiry *
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2.5 bg-ivory border border-gold/25 rounded-lg text-sm text-purple-ink focus:outline-none focus:border-gold cursor-pointer"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Order Status & Delivery">Order Status & Delivery</option>
                    <option value="Bespoke Wedding & Event Scents">Bespoke Wedding & Event Scents</option>
                    <option value="Corporate Gifting">Corporate Gifting & Wholesale</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[0.72rem] tracking-[0.1em] uppercase text-purple-ink/70 font-semibold mb-1.5">
                    Your Message *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about your inquiry or scent preferences..."
                    className="w-full px-4 py-2.5 bg-ivory border border-gold/25 rounded-lg text-sm text-purple-ink focus:outline-none focus:border-gold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 bg-gold hover:bg-gold-bright text-purple-darkest font-semibold text-xs tracking-[0.2em] uppercase rounded-xl transition-all shadow-md"
                >
                  Send Concierge Message
                </button>
              </form>
            )}
          </div>

          {/* Right: Atelier Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gold/15 shadow-sm space-y-5 text-xs text-purple-ink/80">
              <h3 className="font-serif text-xl text-purple-ink font-semibold border-b border-gold/15 pb-3">
                Lagos Atelier & Headquarters
              </h3>

              <div>
                <strong className="text-purple-ink block uppercase tracking-[0.1em] text-[0.7rem] mb-1">
                  Atelier Address
                </strong>
                <p className="leading-relaxed">
                  Victoria Island, Lagos, Nigeria<br />
                  Private consultations by appointment only.
                </p>
              </div>

              <div>
                <strong className="text-purple-ink block uppercase tracking-[0.1em] text-[0.7rem] mb-1">
                  Concierge Hours
                </strong>
                <p>Monday – Saturday: 9:00 AM – 7:00 PM WAT</p>
              </div>

              <div>
                <strong className="text-purple-ink block uppercase tracking-[0.1em] text-[0.7rem] mb-1">
                  Direct Inquiries
                </strong>
                <p>concierge@aromadeluz.com</p>
                <p className="mt-1">+234 (0) 800-AROMA-DELUZ</p>
              </div>

              <div className="pt-4 border-t border-gold/15">
                <a
                  href="https://wa.me/2348000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs tracking-[0.15em] uppercase rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <span>💬</span>
                  <span>Direct WhatsApp Chat</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

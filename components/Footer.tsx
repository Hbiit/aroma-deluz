import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-purple-darkest text-white/70 pt-16">
      <div className="max-w-[1320px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 pb-12 border-b border-white/8">
          {/* Brand — Matching User Design */}
          <div className="sm:col-span-2 lg:col-span-2 flex flex-col items-start pr-0 lg:pr-6">
            <Link href="/" className="inline-block mb-3 group">
              <Image
                src="/brand-logo-transparent.png"
                alt="Aroma De Luz - All About Scent"
                width={220}
                height={140}
                className="w-[180px] sm:w-[205px] h-auto object-contain group-hover:scale-[1.02] transition-transform duration-300 drop-shadow-[0_2px_10px_rgba(201,164,92,0.12)]"
                priority
              />
            </Link>
            <p className="mt-1 text-[0.88rem] leading-relaxed text-white/80 max-w-[280px] font-sans font-normal">
              Scented candles &amp; fine perfumes — timeless fragrance, hand-poured in Lagos.
            </p>
            <div className="flex items-center gap-5 mt-5 text-gold">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:text-gold-bright transition-colors"
                aria-label="Instagram"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:text-gold-bright transition-colors"
                aria-label="Facebook"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.704 0-1.428.172-1.748.561-.319.389-.481 1.054-.481 1.996v1.424h4.156l-.558 3.667h-3.598v7.98h-4.993z"/>
                </svg>
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:text-gold-bright transition-colors"
                aria-label="TikTok"
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.901 2.895 2.896 2.896 0 0 1-2.896-2.895 2.896 2.896 0 0 1 2.896-2.895c.348 0 .684.062.997.177V9.452a6.34 6.34 0 0 0-.997-.08 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.528a8.218 8.218 0 0 0 4.776 1.636V6.719a4.8 4.8 0 0 1-1-.033z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-[0.78rem] font-semibold tracking-[0.15em] uppercase text-white mb-5">Shop</h4>
            <ul className="flex flex-col gap-2.5">
              <li><Link href="/products" className="text-[0.82rem] text-white/50 hover:text-gold transition-colors">All Creations</Link></li>
              <li><Link href="/products?category=candle" className="text-[0.82rem] text-white/50 hover:text-gold transition-colors">Soy Candles</Link></li>
              <li><Link href="/products?category=perfume" className="text-[0.82rem] text-white/50 hover:text-gold transition-colors">Fine Perfumes</Link></li>
              <li><Link href="/products" className="text-[0.82rem] text-white/50 hover:text-gold transition-colors">Discovery Sets</Link></li>
              <li><Link href="/products" className="text-[0.82rem] text-white/50 hover:text-gold transition-colors">Luxury Gifting</Link></li>
            </ul>
          </div>

          {/* Collections */}
          <div>
            <h4 className="text-[0.78rem] font-semibold tracking-[0.15em] uppercase text-white mb-5">Collections</h4>
            <ul className="flex flex-col gap-2.5">
              {['Floral Bouquets', 'Warm & Sensual', 'Fresh & Crisp', 'Exclusive Noir'].map(link => (
                <li key={link}><Link href={`/products?collection=${encodeURIComponent(link)}`} className="text-[0.82rem] text-white/50 hover:text-gold transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>

          {/* Client Concierge & Story */}
          <div>
            <h4 className="text-[0.78rem] font-semibold tracking-[0.15em] uppercase text-white mb-5">Concierge</h4>
            <ul className="flex flex-col gap-2.5">
              <li><Link href="/about" className="text-[0.82rem] text-white/50 hover:text-gold transition-colors">Our Story</Link></li>
              <li><Link href="/contact" className="text-[0.82rem] text-white/50 hover:text-gold transition-colors">Contact Concierge</Link></li>
              <li><Link href="/checkout" className="text-[0.82rem] text-white/50 hover:text-gold transition-colors">Track Order</Link></li>
              <li><Link href="/account" className="text-[0.82rem] text-white/50 hover:text-gold transition-colors">Client Account</Link></li>
            </ul>
          </div>

          {/* Callouts */}
          <div className="space-y-5">
            {[
              { icon: '🚚', title: 'Complimentary Shipping', desc: 'On orders over ₦150,000' },
              { icon: '↩️', title: 'Easy Returns', desc: '30-day luxury guarantee' },
              { icon: '🔒', title: 'Secure Checkout', desc: 'Encrypted transactions' },
            ].map(callout => (
              <div key={callout.title} className="flex items-start gap-2.5">
                <span className="text-base mt-0.5">{callout.icon}</span>
                <div>
                  <h5 className="text-[0.78rem] font-semibold text-white">{callout.title}</h5>
                  <p className="text-[0.72rem] text-white/45">{callout.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between py-5 text-[0.75rem] text-white/35 gap-4">
          <p>© 2025 Aroma Deluz. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-gold transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-gold transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

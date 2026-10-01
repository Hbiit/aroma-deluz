import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-purple-darkest text-white/70 pt-16">
      <div className="max-w-[1320px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 pb-12 border-b border-white/8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-3">
              <Image
                src="/brand-logo.jpg"
                alt="Aroma De Luz - All About Scent"
                width={180}
                height={60}
                className="h-16 w-auto object-contain rounded-md border border-gold/30 shadow-lg"
              />
            </Link>
            <p className="mt-2 text-[0.82rem] leading-relaxed text-white/60 max-w-[220px]">
              Timeless fragrances.<br />Unforgettable presence.
            </p>
            <div className="flex gap-3 mt-5">
              {['𝕏', 'f', '𝐏', '♪'].map((icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/60 text-sm hover:border-gold hover:text-gold hover:bg-gold/10 transition-all">
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-[0.78rem] font-semibold tracking-[0.15em] uppercase text-white mb-5">Shop</h4>
            <ul className="flex flex-col gap-2.5">
              {['All Fragrances', 'Bestsellers', 'Gift Sets', 'Travel Sprays', 'Sale'].map(link => (
                <li key={link}><Link href="/products" className="text-[0.82rem] text-white/50 hover:text-gold transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>

          {/* Collections */}
          <div>
            <h4 className="text-[0.78rem] font-semibold tracking-[0.15em] uppercase text-white mb-5">Collections</h4>
            <ul className="flex flex-col gap-2.5">
              {['Floral Bouquets', 'Warm & Sensual', 'Fresh & Radiant', 'Exclusive Collection'].map(link => (
                <li key={link}><Link href={`/products?collection=${encodeURIComponent(link)}`} className="text-[0.82rem] text-white/50 hover:text-gold transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-[0.78rem] font-semibold tracking-[0.15em] uppercase text-white mb-5">Customer Care</h4>
            <ul className="flex flex-col gap-2.5">
              {['Shipping & Delivery', 'Returns & Exchanges', 'FAQs', 'Contact Us'].map(link => (
                <li key={link}><Link href="#" className="text-[0.82rem] text-white/50 hover:text-gold transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-[0.78rem] font-semibold tracking-[0.15em] uppercase text-white mb-5">About</h4>
            <ul className="flex flex-col gap-2.5">
              {['Our Story', 'Ingredients', 'Craftsmanship', 'Sustainability'].map(link => (
                <li key={link}><Link href="#" className="text-[0.82rem] text-white/50 hover:text-gold transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>

          {/* Callouts */}
          <div className="space-y-5">
            {[
              { icon: '🚚', title: 'Complimentary Shipping', desc: 'On orders over ₦150,000' },
              { icon: '↩️', title: 'Easy Returns', desc: '30-day return policy' },
              { icon: '🔒', title: 'Secure Payments', desc: 'Shop with confidence' },
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

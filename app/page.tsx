import Image from 'next/image';
import Link from 'next/link';
import { getFeaturedProducts } from '@/lib/data';
import { ProductCard } from '@/components/ProductCard';
import { NewsletterForm } from '@/components/NewsletterForm';

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative min-h-[88vh] flex items-center bg-brand-hero text-white overflow-hidden py-16 lg:py-24">
        {/* Subtle overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-darkest/95 via-purple-darkest/85 to-purple-darkest/60" />
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up max-w-[580px] mx-auto lg:mx-0 text-center lg:text-left">
              {/* Brand Logo Badge */}
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-gold/30 mb-6">
                <Image
                  src="/brand-logo.jpg"
                  alt="Aroma De Luz Logo"
                  width={36}
                  height={36}
                  className="w-7 h-7 rounded-full object-cover border border-gold"
                />
                <span className="text-[0.75rem] font-medium tracking-[0.25em] uppercase text-gold">
                  Official Luxury Fragrances & Candles
                </span>
              </div>

              <h1 className="font-serif text-[clamp(2.5rem,5.5vw,4.2rem)] font-normal leading-[1.1] text-white mb-6">
                Scents that<br />
                <em className="italic text-gold-bright">leave a legacy.</em>
              </h1>
              <p className="text-base text-white/85 mb-8 max-w-[460px] leading-relaxed mx-auto lg:mx-0 font-light">
                Aroma De Luz creates timeless luxury candles and fine fragrances that elevate your space with warmth, romance, and unforgettable presence.
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 bg-gold text-purple-darkest text-[0.8rem] font-semibold tracking-[0.2em] uppercase px-9 py-4 rounded hover:bg-gold-bright hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(201,164,92,0.4)] transition-all duration-300"
                >
                  Discover The Collection
                </Link>
                <Link
                  href="/#story"
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white text-[0.8rem] font-medium tracking-[0.2em] uppercase px-8 py-4 rounded border border-white/20 hover:bg-white/20 transition-all duration-300"
                >
                  Our Brand Story
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-6 mt-10 justify-center lg:justify-start pt-4 border-t border-white/10">
                {[
                  { icon: '🌿', label: '100% Organic Soy Wax' },
                  { icon: '⏱', label: '70+ Hours Long-Burn' },
                  { icon: '📍', label: 'Hand-Poured in Lagos' },
                  { icon: '🎁', label: 'Signature Gift Packaging' },
                ].map(badge => (
                  <div key={badge.label} className="flex items-center gap-2 text-[0.78rem] font-medium text-white/80">
                    <span className="text-gold">{badge.icon}</span>
                    {badge.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="animate-fade-in-up flex justify-center lg:justify-end order-first lg:order-last">
              <div className="relative group rounded-2xl overflow-hidden p-2 bg-gradient-to-b from-gold/40 via-purple-deep/30 to-gold/20 shadow-[0_30px_90px_rgba(0,0,0,0.5)] max-w-[540px]">
                <Image
                  src="/website-bg.jpg"
                  alt="Aroma De Luz luxury scented candle with amber glass and gold logo"
                  width={600}
                  height={600}
                  className="rounded-xl object-cover w-full h-[460px] md:h-[520px] transition-transform duration-700 group-hover:scale-[1.02]"
                  priority
                />
                <div className="absolute bottom-6 left-6 right-6 bg-purple-darkest/90 backdrop-blur-md p-4 rounded-lg border border-gold/30 flex items-center justify-between">
                  <div>
                    <p className="text-[0.65rem] tracking-[0.25em] uppercase text-gold">Featured Signature</p>
                    <p className="font-serif text-lg text-white font-semibold">Velvet Lavender & Amber Candle</p>
                  </div>
                  <span className="text-gold font-bold text-sm bg-gold/15 px-3 py-1.5 rounded border border-gold/30">
                    ₦35,000
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SHOP BY COLLECTION ===== */}
      <section className="py-[clamp(3rem,6vw,6rem)] bg-white" id="collections">
        <div className="max-w-[1320px] mx-auto px-4 md:px-8">
          <h2 className="font-serif text-[clamp(1.75rem,3.5vw,2.5rem)] font-normal text-purple-ink text-center tracking-[0.08em] uppercase mb-10">
            Shop By Collection
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { name: 'Floral Bouquets', desc: 'Soft. Romantic. Timeless.', img: '/collection-floral.jpg' },
              { name: 'Warm & Sensual', desc: 'Rich. Alluring. Addictive.', img: '/collection-warm.jpg' },
              { name: 'Fresh & Radiant', desc: 'Light. Elegant. Luminous.', img: '/collection-fresh.jpg' },
              { name: 'Exclusive Collection', desc: 'Rare. Unique. Unforgettable.', img: '/collection-exclusive.jpg' },
            ].map(col => (
              <Link
                key={col.name}
                href={`/products?collection=${encodeURIComponent(col.name)}`}
                className="relative rounded-md overflow-hidden aspect-[3/4] group cursor-pointer"
              >
                <Image
                  src={col.img}
                  alt={col.name}
                  fill
                  className="object-cover transition-transform duration-600 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-ink/85 via-purple-ink/30 to-transparent flex flex-col justify-end p-6 transition-all group-hover:from-purple-ink/90 group-hover:via-purple-ink/40">
                  <h3 className="font-serif text-xl font-semibold text-white mb-1">{col.name}</h3>
                  <p className="text-[0.78rem] text-white/70 italic mb-4">{col.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-[0.75rem] font-semibold tracking-[0.15em] uppercase text-white bg-white/15 backdrop-blur-sm px-5 py-2.5 rounded border border-white/20 w-fit hover:bg-gold hover:text-purple-darkest hover:border-gold transition-all duration-300">
                    Shop Now →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED FRAGRANCES ===== */}
      <section className="py-[clamp(3rem,6vw,6rem)] bg-cream" id="featured">
        <div className="max-w-[1320px] mx-auto px-4 md:px-8">
          <h2 className="font-serif text-[clamp(1.75rem,3.5vw,2.5rem)] font-normal text-purple-ink text-center tracking-[0.08em] uppercase mb-10">
            Featured Fragrances
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 mb-10">
            {featured.slice(0, 5).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center">
            <Link
              href="/products"
              className="text-[0.85rem] font-medium tracking-[0.15em] uppercase text-purple-ink border-b-[1.5px] border-gold pb-1 hover:text-gold transition-colors"
            >
              View All Fragrances →
            </Link>
          </div>
        </div>
      </section>

      {/* ===== OUR STORY ===== */}
      <section className="py-[clamp(3rem,6vw,6rem)] bg-cream" id="story">
        <div className="max-w-[1320px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="max-w-[520px]">
              <p className="text-[0.75rem] font-medium tracking-[0.25em] uppercase text-gold">Our Story</p>
              <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] font-normal leading-[1.15] text-purple-ink mt-3 mb-6">
                The art of fine fragrance<br />is our heritage.
              </h2>
              <p className="text-[0.95rem] text-purple-ink/80 leading-relaxed mb-8">
                At Aroma Deluz, every scent is a work of art — meticulously crafted in Lagos using the world&apos;s finest ingredients. We believe in timeless elegance, sustainable luxury, and the emotion that only a signature scent can evoke.
              </p>
              <Link
                href="/products"
                className="inline-flex bg-transparent text-purple-darkest text-[0.8rem] font-medium tracking-[0.2em] uppercase px-10 py-4 border-[1.5px] border-purple-darkest hover:bg-purple-darkest hover:text-white transition-all duration-300"
              >
                Discover Our Craft
              </Link>

              <div className="grid grid-cols-2 gap-5 mt-10">
                {[
                  { title: 'Finest Ingredients', desc: 'Sourced responsibly from around the world' },
                  { title: 'Expert Artisans', desc: 'Blended by master perfumers in Lagos' },
                  { title: 'Sustainable & Luxury', desc: 'Eco-conscious choices for a better tomorrow' },
                  { title: 'Timeless Quality', desc: 'Made to be treasured for a lifetime' },
                ].map(f => (
                  <div key={f.title} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-deep flex items-center justify-center text-gold text-sm flex-shrink-0">✦</div>
                    <div>
                      <h4 className="text-[0.78rem] font-semibold tracking-[0.05em] uppercase text-purple-ink mb-0.5">{f.title}</h4>
                      <p className="text-[0.72rem] text-purple-ink/60">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg overflow-hidden shadow-[0_20px_60px_rgba(26,15,48,0.12)]">
              <Image
                src="/story.jpg"
                alt="Aroma Deluz artisan crafting perfume"
                width={640}
                height={480}
                className="w-full h-full object-cover min-h-[400px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROMO BAND ===== */}
      <section className="bg-gradient-to-br from-purple-darkest to-purple-deep py-14 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(201,164,92,0.06)_0%,transparent_60%)]" />
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
            <div className="flex items-center gap-6">
              <div className="font-serif text-[3.5rem] font-bold text-gold leading-none">
                20%<span className="block text-xl tracking-[0.1em]">OFF</span>
              </div>
              <div className="text-left">
                <h3 className="font-serif text-xl text-white mb-1">Because you deserve something exquisite.</h3>
                <p className="text-[0.85rem] text-white/70">Enjoy 20% off your order for a limited time only.</p>
              </div>
            </div>
            <Link
              href="/products"
              className="bg-gold text-purple-darkest text-[0.8rem] font-semibold tracking-[0.2em] uppercase px-10 py-4 rounded hover:bg-gold-bright hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(201,164,92,0.3)] transition-all duration-300"
            >
              Shop The Sale
            </Link>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-[clamp(3rem,6vw,6rem)] bg-ivory" id="testimonials">
        <div className="max-w-[1320px] mx-auto px-4 md:px-8">
          <h2 className="font-serif text-[clamp(1.75rem,3.5vw,2.5rem)] font-normal text-purple-ink text-center tracking-[0.08em] uppercase mb-10">
            Loved By Our Clients
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { quote: '"Aroma Deluz is pure luxury. The scents are sophisticated, long-lasting, and absolutely mesmerizing."', name: 'Emily R.', initial: 'E' },
              { quote: '"The attention to detail in every bottle is unmatched. It feels like wearing confidence and elegance."', name: 'Sophia M.', initial: 'S' },
              { quote: '"I\'ve found my signature scent. Aroma Deluz is now the only perfume brand I trust and adore."', name: 'Lauren T.', initial: 'L' },
            ].map(t => (
              <div key={t.name} className="bg-white rounded-lg p-8 text-center shadow-[0_4px_20px_rgba(26,15,48,0.05)] border border-gold/10 hover:-translate-y-1.5 hover:shadow-[0_12px_40px_rgba(26,15,48,0.1)] transition-all duration-300">
                <div className="text-gold text-base tracking-[0.2em] mb-4">★★★★★</div>
                <p className="font-serif italic text-purple-ink leading-relaxed mb-6">{t.quote}</p>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-deep to-gold mx-auto mb-3 flex items-center justify-center text-white font-serif text-xl font-semibold">
                  {t.initial}
                </div>
                <p className="font-semibold text-[0.9rem] text-purple-ink">{t.name}</p>
                <p className="text-[0.75rem] text-gold italic">Verified Buyer</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== NEWSLETTER ===== */}
      <section className="bg-gradient-to-br from-purple-darkest to-purple-deep py-14 relative overflow-hidden" id="newsletter">
        <div className="absolute -top-1/2 -right-[10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(201,164,92,0.08)_0%,transparent_70%)]" />
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h3 className="font-serif text-2xl text-gold mb-1">Stay inspired & be the first to know</h3>
              <p className="text-[0.85rem] text-white/70">Exclusive offers, new arrivals, and fragrance stories.</p>
            </div>
            <NewsletterForm />
          </div>
        </div>
      </section>
    </>
  );
}

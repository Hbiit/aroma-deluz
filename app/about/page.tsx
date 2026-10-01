import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Our Story & Artisanal Heritage — Aroma Deluz',
  description: 'The story behind Aroma Deluz. Handcrafted luxury scented candles and fine fragrances in Lagos, Nigeria.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Header */}
      <section className="bg-gradient-to-r from-purple-darkest via-purple-deep to-purple-darkest text-white py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(201,164,92,0.12)_0%,transparent_60%)]" />
        <div className="max-w-[800px] mx-auto px-4 relative z-10">
          <p className="text-[0.75rem] font-medium tracking-[0.3em] uppercase text-gold mb-3">
            Haute Parfumerie & Candle Atelier
          </p>
          <h1 className="font-serif text-[clamp(2.5rem,5vw,4rem)] font-normal text-white mb-6 leading-tight">
            Crafting Scents That<br />
            <em className="italic text-gold-bright">Leave A Legacy.</em>
          </h1>
          <p className="text-white/80 text-base font-light max-w-[580px] mx-auto leading-relaxed">
            Born from a passion for timeless elegance, Aroma De Luz was founded to bring world-class luxury fragrances and organic soy candles to lovers of exquisite scents.
          </p>
        </div>
      </section>

      {/* Chapter 1: The Atelier in Lagos */}
      <section className="py-20 px-4 md:px-8 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-gold font-bold">
              The Genesis
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-purple-ink mt-2 mb-6 leading-snug">
              Every bottle and candle begins with a whisper of inspiration.
            </h2>
            <p className="text-sm md:text-base text-purple-ink/80 leading-relaxed mb-6 font-light">
              In our Lagos atelier, master perfumers harmonize rare essences: from intoxicating Damask roses and precious Cambodian oud, to sparkling Sicilian bergamot and Madagascar bourbon vanilla.
            </p>
            <p className="text-sm md:text-base text-purple-ink/80 leading-relaxed font-light mb-8">
              We reject fleeting trends. Each scent is patient, developed over months of olfactory balancing to ensure a transformative fragrance that lingers gracefully in your home and on your skin.
            </p>
            <Link
              href="/products"
              className="inline-flex px-8 py-3.5 bg-purple-darkest text-white text-xs font-semibold tracking-[0.2em] uppercase rounded-xl hover:bg-gold hover:text-purple-darkest transition-all"
            >
              Explore Our Creations
            </Link>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(26,15,48,0.12)] border border-gold/20 p-2 bg-white">
            <Image
              src="/website-bg.jpg"
              alt="Aroma De Luz luxury candle in amber glass"
              width={600}
              height={500}
              className="rounded-xl object-cover w-full h-[460px]"
            />
          </div>
        </div>
      </section>

      {/* Chapter 2: The Four Pillars */}
      <section className="py-16 bg-white border-t border-b border-gold/15">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8">
          <h2 className="font-serif text-3xl text-purple-ink text-center mb-12 uppercase tracking-[0.08em]">
            The Pillars of Our Craft
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: '🌿',
                title: '100% Organic Soy Wax',
                desc: 'Clean, soot-free burns with zero paraffin, phthalates, or toxic stabilizers.',
              },
              {
                icon: '🧪',
                title: 'Extrait Concentrations',
                desc: 'Formulated with ultra-rich fragrance oil percentages for exceptional sillage.',
              },
              {
                icon: '✨',
                title: 'Hand-Poured in Lagos',
                desc: 'Poured in small artisanal batches to guarantee peak freshness and perfection.',
              },
              {
                icon: '🎁',
                title: 'Heirloom Packaging',
                desc: 'Amber glass jars and gold-embossed boxes designed to be treasured forever.',
              },
            ].map((pillar) => (
              <div
                key={pillar.title}
                className="p-6 rounded-xl bg-ivory border border-gold/15 hover:-translate-y-1 hover:shadow-md transition-all text-center"
              >
                <div className="text-3xl mb-3">{pillar.icon}</div>
                <h3 className="font-serif text-lg text-purple-ink font-semibold mb-2">
                  {pillar.title}
                </h3>
                <p className="text-xs text-purple-ink/70 leading-relaxed font-light">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

import { Suspense } from 'react';
import { getProducts } from '@/lib/data';
import { ProductsCatalog } from '@/components/ProductsCatalog';

export const metadata = {
  title: 'Shop All Fragrances & Scented Candles — Aroma Deluz',
  description: 'Explore our complete collection of handcrafted scented candles and fine perfumes, made with rare organic ingredients in Lagos.',
};

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-cream">
      {/* Banner */}
      <section className="bg-gradient-to-r from-purple-darkest via-purple-deep to-purple-darkest text-white py-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(201,164,92,0.12)_0%,transparent_60%)]" />
        <div className="max-w-[800px] mx-auto px-4 relative z-10">
          <p className="text-[0.75rem] font-medium tracking-[0.3em] uppercase text-gold mb-3">
            Handcrafted Luxury
          </p>
          <h1 className="font-serif text-[clamp(2.2rem,4.5vw,3.5rem)] font-normal text-white mb-4">
            The Complete Atelier Collection
          </h1>
          <p className="text-white/70 text-sm md:text-base font-light max-w-[540px] mx-auto leading-relaxed">
            Immerse yourself in our signature hand-poured soy wax candles and long-lasting artisanal perfumes.
          </p>
        </div>
      </section>

      {/* Catalog with Suspense */}
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center">
            <span className="inline-block w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <ProductsCatalog initialProducts={products} />
      </Suspense>
    </div>
  );
}

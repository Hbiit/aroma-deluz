import type { Metadata } from 'next';
import { Cormorant_Garamond, Jost } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { Header } from '@/components/Header';
import { CartSidebar } from '@/components/CartSidebar';
import { AuthPromptModal } from '@/components/AuthPromptModal';
import { Footer } from '@/components/Footer';
import './globals.css';

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const jost = Jost({
  variable: '--font-jost',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Aroma Deluz — Luxury Scented Candles & Perfumes',
  description:
    'Aroma Deluz creates timeless fragrances that celebrate elegance, femininity, and unforgettable presence. Luxury scented candles and perfumes, hand-poured in Lagos.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable}`}>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <CartProvider>
            {/* Announcement Bar */}
            <div className="bg-purple-darkest text-gold text-[0.75rem] tracking-[0.12em] uppercase py-2.5 px-4 text-center flex justify-center gap-6 flex-wrap font-sans">
              <span className="inline-flex items-center gap-2">
                <span className="text-gold-bright text-[0.6rem]">✦</span>
                Complimentary Delivery On Orders Over ₦150,000
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="text-gold-bright text-[0.6rem]">✦</span>
                Sample With Every Order
              </span>
              <span className="hidden md:inline-flex items-center gap-2">
                <span className="text-gold-bright text-[0.6rem]">✦</span>
                Luxury Gift Wrapping
              </span>
            </div>

            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <CartSidebar />
            <AuthPromptModal />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

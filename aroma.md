# Aroma Deluz — Product Requirements Document (PRD)

**Product:** Aroma Deluz — luxury e-commerce storefront for scented candles & perfumes
**Stack:** Next.js 16 (App Router, TypeScript, Tailwind CSS v4) · Supabase (Postgres + Google Auth) · Paystack (NGN payments) · Mailgun (transactional email)
**Currency:** Nigerian Naira (₦, NGN) — stored as integers in kobo
**Status:** Approved mission — this file is the canonical spec every later pass follows.

---

## 1. Brand Guidelines

### 1.1 Colors
| Token | Hex | Usage |
|---|---|---|
| `purple-deep` | `#3B2367` | Primary brand purple — buttons, banners, accents |
| `purple-darkest` | `#241441` | Footer, announcement bar, promo band, hero overlay |
| `purple-ink` | `#1A0F30` | Text on light backgrounds, hover states |
| `gold` | `#C9A45C` | **Deep gold letters** — headings, logo, prices, links, icons |
| `gold-bright` | `#E3C77F` | Gold hover states, star ratings, thin divider lines |
| `cream` | `#F7F2EA` | Light section backgrounds, card fills |
| `ivory` | `#FDFBF7` | Page background |
| White | `#FFFFFF` | Body text on purple, button text on gold |

Rule: **deep gold is the color of words/letters** — all headings, the logotype, prices, nav links on dark surfaces, and section eyebrows render in gold. Deep purple is the color of surfaces, buttons, and bands. Body text on cream/ivory is `purple-ink`.

### 1.2 Typography
- **Display / headings / logo:** Cormorant Garamond (elegant high-contrast serif), tracked-out uppercase for eyebrows and section titles.
- **Body / UI:** Jost (clean geometric sans).
- Both loaded via `next/font/google` with CSS-variable tokens (`--font-cormorant`, `--font-jost`) wired into Tailwind v4 `@theme`.

### 1.3 Logo
Wordmark: **AROMA** (gold, serif, large) with **DELUZ** beneath in small letter-spaced caps — a two-line lockup mirroring the blueprint.

---

## 2. Homepage Blueprint (from the supplied reference template)

Section order, exactly:

1. **Announcement bar** — `purple-darkest`, gold text: "Complimentary delivery on orders over ₦150,000 · Sample with every order · Luxury gift wrapping"
2. **Header** — nav left (Shop, Collections, Bestsellers), centered logotype, nav right (About, Contact), account icon (Google sign-in state), cart icon with live count badge.
3. **Hero with promotional video** — full-bleed autoplaying, muted, looping stock video (candlelight/perfume) with a deep-purple scrim; gold eyebrow "CRAFTED TO CAPTIVATE", large serif headline in gold, sub-copy, gold CTA "DISCOVER THE COLLECTION". Trust-badge row beneath: Clean ingredients · Long-lasting performance · Hand-poured in Lagos · Luxury packaging.
4. **Shop by Collection** — 4 image cards (Floral Bouquets, Warm & Sensual, Fresh & Radiant, Exclusive Collection), one-line description + SHOP NOW, linking to `/products?collection=…`.
5. **Featured Fragrances** — product-card row (image, name, category caption, ₦ price, ADD TO CART) + "VIEW ALL FRAGRANCES →".
6. **Our Story** — editorial split: text left (gold eyebrow, serif heading, body, DISCOVER OUR CRAFT button, 4 icon bullets), image right.
7. **Promo band** — deep purple: "20% OFF — Because you deserve something exquisite." + SHOP THE SALE button.
8. **Testimonials** — "LOVED BY OUR CLIENTS": 3 quote cards, gold stars, reviewer name & city, arrows.
9. **Newsletter band** — deep purple, floral image left: "Stay inspired & be the first to know" + email input + SIGN ME UP → stores to `subscribers`.
10. **Footer** — brand blurb + socials; columns Shop / Collections / Customer Care / About; right rail with shipping, returns, secure payments (Paystack) callouts; legal bar.

Interior pages keep the same language: cream/ivory backgrounds, purple bands, gold serif headings.

---

## 3. Functional Scope

### 3.1 Pages & routes
| Route | Type | Purpose |
|---|---|---|
| `/` | Server | Homepage per §2; featured products & collections from DB |
| `/products` | Server | Catalog grid; filters `?category=candle|perfume`, `?collection=…` |
| `/products/[slug]` | Server | Detail: image, scent notes, price, stock, qty picker, add-to-cart |
| `/cart` | Client | Line items, qty ±, remove, subtotal, checkout CTA |
| `/checkout` | Client | Contact + delivery form, order summary, **Pay with Paystack** |
| `/checkout/success` | Server | Server-side verification; shows confirmed order |
| `/auth/callback` | Route handler | Supabase OAuth code exchange |
| `POST /api/checkout` | API | Re-price cart from DB, create pending order, initialize Paystack |
| `GET /api/orders/[reference]` | API | Verify via Paystack, mark paid, send Mailgun email (once) |
| `POST /api/newsletter` | API | Store subscriber (service-role) |

### 3.2 Cart
React context + `localStorage`. Stores id, slug, name, price_kobo, image, qty. Header badge reflects count. Server **re-prices** at checkout; client prices are never trusted.

### 3.3 Checkout flow
1. `/checkout` submits email, full name, phone, address, city, state, note + cart.
2. `POST /api/checkout` validates, re-prices from DB, inserts order (`pending`) + items, calls Paystack `transaction/initialize` (amount in kobo, `reference = order id`, `callback_url = {SITE_URL}/checkout/success`).
3. Customer pays on Paystack's hosted page → redirect back with `?reference=…`.
4. Verification is **server-side only**: `GET /transaction/verify/:reference` must return `success` with an amount matching the order total; the redirect alone is never proof of payment. Order marked `paid`.
5. Mailgun confirmation email fires on first successful verification; `email_sent_at` guards against duplicates; failures are logged and never block the customer.

**Demo mode (clearly labeled):** when `PAYSTACK_SECRET_KEY` is absent, checkout creates the order and the success page confirms it with a visible "Demo mode — no payment was taken" badge. When Supabase env is absent, a documented in-memory store with the same 12 seeded products keeps the site fully browsable.

### 3.4 Payments (Paystack)
- NGN only; amounts in kobo (×100), integers.
- Test keys in dev; `callback_url` passed per-request so localhost works.
- Reference = order id → idempotent verification.

### 3.5 Auth (Google via Supabase)
- Google Cloud Console: OAuth consent screen + Web client; redirect `https://<ref>.supabase.co/auth/v1/callback`; client ID/secret pasted into Supabase Auth settings.
- App: `@supabase/ssr` cookie sessions, `middleware.ts` session refresh, `/auth/callback` exchange, header button toggles Sign in / account + Sign out.
- Guests may check out; signed-in orders link `user_id` and pre-fill contact details.

### 3.6 Emails (Mailgun)
- `mailgun.js` v4 + `form-data`, server-side only.
- HTML confirmation: order number, itemized products with qty & prices, total in ₦, delivery address.
- From `orders@<MAILGUN_DOMAIN>` (sandbox acceptable in dev).

### 3.7 Database (Supabase Postgres) — `supabase/migration.sql` + `supabase/seed.sql`
```sql
products     (id uuid pk default gen_random_uuid(), slug text unique not null, name text not null,
              description text, category text not null check (category in ('candle','perfume')),
              collection text, price_kobo int not null check (price_kobo > 0), scent_notes text[],
              image_url text, stock int not null default 0, featured bool not null default false,
              created_at timestamptz not null default now())
orders       (id uuid pk default gen_random_uuid(), reference text unique not null,
              user_id uuid references auth.users(id) on delete set null,
              email text not null, full_name text, phone text, address text, city text,
              state text, note text, status text not null default 'pending'
              check (status in ('pending','paid','cancelled','failed')),
              total_kobo int not null, paystack_authorization_url text, paystack_access_code text,
              demo boolean not null default false,
              email_sent_at timestamptz, created_at timestamptz not null default now())
order_items  (id uuid pk default gen_random_uuid(), order_id uuid not null references orders(id) on delete cascade,
              product_id uuid references products(id), name text not null,
              unit_price_kobo int not null, quantity int not null check (quantity > 0))
subscribers  (id uuid pk default gen_random_uuid(), email text unique not null,
              created_at timestamptz not null default now())
```
- RLS: public `SELECT` on `products`; `subscribers` insert-only via service role; `orders`/`order_items` written only with the service-role key (never exposed to the browser).
- Seed: 12 products (6 candles, 6 perfumes) across the 4 collections with verified Pexels photography.

---

## 4. Environment Variables (`.env.example`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
PAYSTACK_SECRET_KEY=
MAILGUN_API_KEY=
MAILGUN_DOMAIN=
MAILGUN_FROM="Aroma Deluz <orders@your-domain>"
```

## 5. Acceptance Criteria
- Homepage matches §2 section order with purple/gold branding; hero is a working autoplaying promotional video.
- Catalog, detail, cart, checkout, success pages fully navigable with seeded products.
- Google sign-in works once Supabase + Google Cloud Console are configured (README checklist).
- End-to-end Paystack test-card payment verifies once keys are set; demo mode otherwise, clearly labeled.
- Mailgun confirmation delivered on paid orders, never duplicated.
- `tsc --noEmit` clean; `next build` succeeds; flow smoke-tested in the preview browser.

## 6. Out of Scope
Admin panel (catalog managed in the Supabase table editor), discount-code engine, order-history account area, webhook listener (verify-on-callback chosen; webhook hardening is a follow-up).

# Duka Letu shop system: interactive prototype

A clickable prototype of an online storefront and shop management app for a Kenyan electronics, hardware and home-goods shop. It's built to show the owner what the full system would do, before quoting.

"Duka Letu" is a placeholder name. All prices, stock levels and business details are **demonstration values**. Payments and sign-in are **simulated**.

- Product requirements: [`docs/PRD.md`](docs/PRD.md)
- Design system: [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)

## Run it

Requires Node 20+.

```bash
npm install
npm run dev          # http://localhost:3000
# or a production build
npm run build && npm start
```

Opening `/` shows the customer storefront. Staff sign in from the discreet **Staff login** link in the footer (`/staff/login`).

### Demo staff accounts

| Role | Username | PIN | Can use |
| --- | --- | --- | --- |
| Owner | `owner` | `1234` | Everything |
| Cashier | `cashier` | `2345` | Point of sale, orders |
| Stock clerk | `stock` | `3456` | Products, inventory (no prices or sales figures) |

To start a demo from a clean slate, sign in as the owner and go to **Settings → Reset demo data**.

## What's in it

**Storefront**

- Homepage: hero, nine categories, featured, popular and new arrivals, delivery and payment information.
- Search plus filters: category, brand, budget, price range and in stock. Sort by featured, price or newest. Active-filter chips and "Clear all".
- Product page: gallery, variants (wattage, colour, size) each with their own price and stock, quantity limited to stock, add to cart and buy now.
- Cart saved on the device. Quantities are capped at live stock, and items that sell out are flagged.
- Checkout with Kenyan phone validation:
  - Fulfilment: free pickup, or delivery by zone with an automatic fee.
  - Payment: M-Pesa Till, M-Pesa Paybill, or cash (pickup only).
- **Simulated M-Pesa STK push** with success and cancel outcomes, retry, and a clear "no money moves" notice.
- Order confirmation with an order-number tracker and an optional "Confirm on WhatsApp" button.
- Order tracking by order number plus phone. Only the steps for that fulfilment method are shown.

**Staff app** (role-based navigation, plus permission checks inside every action)

- **Dashboard:** sales today (shop and online), new orders, low and out-of-stock counts, a 7-day stacked chart (shop vs online, with tooltips and a table view), top sellers, stock alerts and recent activity. All figures come from live data.
- **Orders:** New / In progress / Completed / Cancelled tabs, search and a detail drawer.
  - Status moves through validated steps for each fulfilment method.
  - Record cash or an M-Pesa code. An order can't be marked collected or delivered until it's paid.
  - Cancel with a reason. Stock is restored exactly once.
- **Products (CMS):** add, edit, delete, publish and hide.
  - Multiple photos are resized in the browser and stored in IndexedDB.
  - Multiple variants, each with SKU, price and opening stock.
  - Stock clerks never see prices, and their new items wait for the owner to price them.
- **Inventory:** stock in, stock out and count adjustments with reasons; low and out-of-stock filters; a full movement log (who, what, before → after, reference).
- **Point of sale:** search, or scan/type a SKU and press Enter. Variant picker, quantity controls, cash with quick amounts and change, or an M-Pesa confirmation code (duplicate codes are rejected). Receipt can be printed (80mm print stylesheet) or shared/copied.
- **Staff:** add, edit, change role, deactivate and reactivate, reset PIN. The last active owner can't be removed.
- **Settings:** shop details, Till and Paybill numbers, WhatsApp number, delivery zones and fees, low-stock threshold, demo reset. Changes apply everywhere at once.

**Shared business rules** (`src/lib/actions.ts`): one stock count is shared by the website and the till, and every stock change writes a movement record.

- Duplicate checkout and duplicate POS submissions are idempotent (keyed per attempt).
- Payment can't be confirmed twice.
- Order transitions are validated.
- Every mutation is atomic: it runs on a copy of the data and commits only if all rules pass.

## Catalogue

There are 48 sample products in 9 categories, built from the 51 shop status photos in `assets/raw/Statuses`. Those originals are git-ignored; the processed copies are in `public/products`. Regenerate them with `npm run images`, which needs Python with Pillow.

Some names and models were read from the photos and may be wrong. These products are marked **To confirm** in the staff Products page, for example the COB light module, cooker coils, gas regulator, Oraimo headphones and some generic speakers. Several photos still carry the "Xender" watermark and wholesale carton text (e.g. "Full ctn 120pcs"), so the owner should supply clean photos.

## Project structure

```
src/
  app/(shop)/…          storefront routes: /, /products, /category/[slug], /product/[slug], /cart, /checkout, /order/[id], /track
  app/staff/…           /staff/login and the protected staff routes
  components/shared/    design-system primitives (ui.tsx, toast, ProductImage, OrderBits, bits)
  components/storefront/, components/staff/, components/layout/
  lib/                  store (persistence), actions (business rules), permissions, calculations, orders, format, validation, images
  data/                 catalogue + seed (orders, POS sales, movements, staff, settings)
  types/
scripts/                image processing, E2E workflows, responsive sweep
```

Data is stored in `localStorage` (`duka.data`, `duka.cart`, `duka.session`), with uploaded photos in IndexedDB. The data is versioned: missing, malformed or outdated data is replaced with a fresh seed. Storage failures (full or blocked storage) show a warning. Several tabs stay in sync.

## Testing

Both scripts use the pre-installed Playwright and run against a running server:

```bash
BASE_URL=http://localhost:3000 node scripts/e2e-workflows.js     # workflows A–E, 40 checks
BASE_URL=http://localhost:3000 node scripts/responsive-sweep.js  # 15 pages × 1440px and 390px
```

Results on 2 November 2026, production build, Chromium:

- **End-to-end:** 40 of 40 checks passed, with no console or page errors. They cover:
  - customer purchase with delivery and simulated M-Pesa, then tracking (including a wrong-phone rejection);
  - order processing through every status, with cash required before collection and cancel-restock;
  - a POS cash sale with change and stock deduction;
  - a stock clerk recording stock in, viewing the movement log and confirming no prices are visible;
  - the owner adding a product with photo and variants, publishing, editing and unpublishing it;
  - role blocks: cashier on Settings, clerk on POS.
- **Desktop, 1440px:** all 15 pages have no horizontal overflow, exactly one `h1` and no errors.
- **Mobile, 390px:** all 15 pages have no horizontal overflow and one `h1`. Screenshots were reviewed by eye. Defects found and fixed along the way: dashboard chart width on mobile, the desktop "Buy now" button leaking onto mobile, and inventory tables replaced by cards on phones.

The responsive sweep checks layout only. Screen-reader and keyboard behaviour were built to the rules in `DESIGN_SYSTEM.md` but not audited with assistive technology.

## Known limitations (by design for a prototype)

- **No server or database.** Data lives in this browser only, so staff and customers on different devices won't see each other's changes.
- **Payments are simulated.** No Daraja or STK push call is made. Live M-Pesa needs the shop's Till or Paybill plus Safaricom go-live approval.
- **Sign-in is simulated.** PINs are stored in plain text in localStorage. This is not secure authentication.
- **No real notifications.** There's no SMS, email or WhatsApp sending. The WhatsApp button only opens a prefilled chat.
- No barcode-camera scanning. "Scan" means a USB scanner or typing the SKU into the search box.
- Placeholder business details: name, logo, address, Till and Paybill numbers, WhatsApp number and delivery areas.

## Deploying a shareable demo

It's a standard Next.js app with no environment variables, so it deploys as-is to Vercel, Netlify or Cloudflare (via OpenNext). Each visitor gets their own seeded copy of the data in their browser. Don't publish it publicly until the owner has agreed.

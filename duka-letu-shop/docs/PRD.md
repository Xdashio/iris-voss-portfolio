# Duka Letu Shop System PRD

2 Nov 2026 · @singason

## Overview

We are building a website with online checkout, a staff-run CMS, inventory and an in-shop point of sale for a general electronics, hardware and home-goods shop, so its owner can stop posting products one by one on WhatsApp status.

The owner is the developer's cousin. She sells lights, torches, speakers, sockets, kitchen gear and more from a physical shop, and customers currently find products only through her status posts. The developer (Singason) shows a clickable HTML/CSS/JS prototype first, then sends a quote, then builds the full system once she accepts. The shop name is a placeholder ("Duka Letu") until she confirms the real one.

## Decisions already made

| Area | Decision |
| --- | --- |
| Customers | Retail only. One price per variant, no carton or wholesale pricing. |
| Payments | M-Pesa Till and M-Pesa Paybill, plus cash on pickup. Cash is not offered for delivery. |
| Fulfilment | Pickup in the shop (free) or delivery within town. Zones and fees are owner-set; the sample uses 3 zones at KSh 100, 200 and 350. |
| Checkout | Full online checkout. WhatsApp is only an optional order-confirmation button, never the main route. |
| Staff | The shop has staff, so the system needs separate logins and roles. |
| Brand | Placeholder shop name and logo until the owner supplies them. |
| Prototype | Static HTML/CSS/JS, shareable by link, built before the quote. |
| Look | Use the Wellups Auto Tyres design system (rules below). |

## Users and roles

| Role | What they can do |
| --- | --- |
| Customer | Browse, search, filter, order and pay as a guest, then track the order with order number and phone. No account needed. |
| Owner | Everything: dashboard, orders, products and prices, inventory, POS, staff, settings. |
| Cashier | POS and orders only. |
| Stock clerk | Products and stock only. Prices are hidden and read-only. |

## Features by module

### Storefront

- Jumia-style categories, search, filters (category, brand, budget, in stock), sort.
- Product page with photo gallery, variants (wattage, colour, size), live stock and price per variant.
- Cart, then checkout with pickup or delivery by zone and M-Pesa Till, Paybill or cash on pickup.
- Order page with a status tracker and an optional "Confirm on WhatsApp" button; order lookup by number and phone.

### Admin CMS

- Add and edit products: upload photos (auto-resized), category, brand, description, variants with price and stock; hide or publish.
- Orders list with status steps (placed, packed, out for delivery or ready for pickup, delivered or collected), mark cash as paid, cancel and restock.
- Settings: shop details, Till and Paybill numbers, WhatsApp number, delivery zones and fees, low-stock threshold.

### Inventory

- One stock count shared by the website and the till. Online orders and POS sales both reduce it.
- Stock in, stock out and count adjustments with a reason; low-stock and out-of-stock alerts; a movement log recording who changed what.

### Point of sale

- Search or scan a SKU, add to a sale, take cash (with change) or M-Pesa (with confirmation code), print or send a receipt.

### Dashboard

- Sales today, online orders waiting, low stock, 7-day sales chart (shop vs online), top sellers.

## Catalogue

Nine categories: Lighting, Torches, Audio (speakers, radios, headphones), Power (sockets, plugs, cable), Tools, Home and kitchen, Security cameras, TV mounts, Other. The prototype holds 48 sample products built from 51 shop photos, each with variants (wattage, colour, size).

Product names and models were read from photos and may be wrong in places (for example foam covers, cooker coils and COB light units). Prices and stock in the prototype are invented sample data; the owner must supply real ones. Products are stored as: id, category, name, brand, photos, description, and a list of variants (label, price in KSh, stock).

## Design system rules (Wellups) and how UI must be built

### Process rules (read these first)

1. Before any UI work, read the design system sources: the Wellups repo docs (`FRONTEND_DESIGN_SYSTEM.md`, `DESIGN.md`, `ANIMATIONS.md`), `app/globals.css` and `prototype/welllups.html`. Do not start from memory or from a generic look.
2. Never invent a new visual language, palette or font. Use only the tokens below. If something is missing, extend it in the same style and say so.
3. Build real, finished screens, not sketches. Every page needs empty, loading, error and success states.
4. Check every page in a browser at desktop width and at 390px before showing it.
5. One h1 per page, labelled form fields, visible focus, keyboard-operable dialogs.

### Tokens

| Token | Value |
| --- | --- |
| Primary | `#045CB4` (dark `#043D8B`, active `#032A6A`) |
| Navy | `#144177`; muted blue `#658EBE` |
| Background / card | `#F1F0EF` / `#FFFFFF` |
| Text / muted text | `#1A1B1B` / `#666666` |
| Border / muted fill | `#E0DFDD` / `#E8E9EC` |
| Success / warning / error / info | `#16A34A` / `#D97706` / `#DC2626` / `#2563EB` |
| WhatsApp | `#25D366` |
| Overlay | `rgba(10,25,47,.6)` |
| Font | Plus Jakarta Sans, weights 400 to 800 |
| Container | max 1240px; side padding 40px, 24px under 900px, 16px under 560px |

### Look and behaviour

- Single light theme; no dark mode.
- Square corners by default. Small radius (0.25rem) only for badges, chips and table wrappers; full radius only for icon buttons and dots.
- Product grid has 1px gaps; on hover a 2px inset primary ring, no lifted shadow.
- Stock badge uses a single rounded corner. Subtle tread-texture pattern on dark bands.
- Buttons: primary, secondary, outline, ghost, destructive, success; sizes sm, md, lg.
- Motion: transform and opacity only, paused off-screen, respects reduced-motion. No decorative animation on admin or checkout screens.
- Wellups is quote-based; this shop is not. Keep its look but show real prices, a cart and checkout.

## Prototype status and lessons

**Status.** Version 2 is published as a single-page demo (https://claude.ai/artifact/8dH3FRkNAmSwrJkGUSQ1kY). It has the full storefront, checkout with a simulated M-Pesa prompt, order tracking, and a staff area with dashboard, orders, products, inventory, POS, staff and settings. Staff demo PIN is 1234. Data lives in the browser only.

**What it is not.** Payments are simulated, there is no server or database, and prices and stock are sample data. Treat it as a visual and behavioural reference, not as code to extend.

### Lessons

- Version 1 looked generic because it used invented colours, rounded UI and a dark mode. The fix was to read the real design system first, then build to it.
- Known fix still pending: the font link in `index.html` still points to the old fonts and must load Plus Jakarta Sans 400 to 800.
- Keep the hero headline modest (about 38 to 62px) so it does not wrap to four lines.
- Product images need fixed aspect-ratio boxes with the image positioned inside, or card heights go uneven.

## Open questions

- Shop name, logo, opening hours, address and WhatsApp number.
- Till number and Paybill number (with account format) for real payments.
- Is the shop registered for M-Pesa Daraja? Online STK Push needs a Till or Paybill and Safaricom go-live approval; until then payments are confirmed manually.
- Delivery area: which town or areas, and the fee for each.
- Real product list, prices and opening stock; confirm the product names read from photos.
- Who the staff are and which role each gets.
- Receipt format and whether she wants a thermal printer or phone receipts.
- Budget and timeline for the quote.

## Phased build plan

The real build should follow the Wellups stack (Next.js, Supabase, Tailwind, Cloudflare). Each phase is one small, focused prompt, finished and checked in a browser before the next starts.

1. **Foundation.** Project setup, Plus Jakarta Sans, design tokens, base components (buttons, badges, inputs, dialogs, toasts).
2. **Database.** Supabase tables for products, variants, stock movements, orders, order items, payments, staff, settings, delivery zones; row-level security by role.
3. **Storefront.** Home, category, product page, search and filters, using real data.
4. **Cart and checkout.** Pickup or delivery, zone fees, order creation that reduces stock safely.
5. **Payments.** Manual Till and Paybill confirmation first; M-Pesa STK Push once Daraja approval is in.
6. **Admin.** Login and roles, dashboard, orders, product CMS with photo upload.
7. **Inventory.** Adjustments, movement log, low-stock alerts.
8. **POS.** Sale screen, cash and M-Pesa, receipts, shared stock.
9. **Polish and launch.** Real data import, accessibility pass, mobile pass, domain, handover to the owner and staff.

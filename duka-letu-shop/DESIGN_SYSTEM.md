# Duka design system

The visual system for the Duka Letu storefront and staff app. It was created from scratch for this project and does not borrow from any other project's design system. The tokens below are the ones in `src/app/globals.css` (Tailwind v4 `@theme`). If you change one, change both.

## Philosophy

- **Products first.** Real shop photos carry the storefront. The chrome around them stays quiet: warm neutral canvas, hairline borders, very few shadows.
- **A shop, not a SaaS.** One deep "ink" teal for brand surfaces (header band, hero, footer, staff sidebar) and one warm marigold accent for the moments that matter: the cart badge, the search button, "Buy now", "Complete sale", the demo banner. Marigold is the colour of a shop awning and of price stickers.
- **Same platform, two jobs.** The storefront and staff app share tokens, type and components. The storefront spends more space on photography. The staff app spends it on tables, counts and fast actions.
- **Honest.** Prices, stock and delivery fees are always shown upfront. Anything simulated in the prototype says so.

## Brand identity

- **Mark:** a placeholder logo, a rounded square with an awning scallop over a "D" (`LogoMark` in `components/shared/bits.tsx`). It has a teal version on light backgrounds and a marigold one on dark. Swap it when the owner supplies a logo.
- **Signature motif:** the **shelf edge**, a 4px rule under the header and above the footer: 72px of marigold, then ink (`.shelf-edge`). Use it only at those two seams.
- **Name:** "Duka Letu" is a placeholder, editable in Settings.

## Colour tokens

| Token | Hex | Use |
| --- | --- | --- |
| `ink-950` / `900` / `800` / `700` | `#071d21` `#0b2a2f` `#113a40` `#1b4d54` | Brand surfaces: hero, footer, sidebar, category bar, overlays |
| `brand-700` / `600` / `500` | `#0b5753` `#0f6e68` `#16837c` | Primary actions, links, selected states, focus ring (500) |
| `brand-100` / `50` | `#d7ebe7` `#edf6f4` | Selected backgrounds, info tiles |
| `marigold-600` / `500` | `#d9961c` `#f2b13a` | Accent CTA (hover / base), cart badge, highlights on ink |
| `marigold-200` / `100` | `#f9dc9f` `#fcf0d6` | Demo notices, text selection |
| `clay-600` / `100` | `#a8492a` `#f6e2d8` | "New" badge, stock-clerk role |
| `canvas` | `#f6f4ef` | Page background (warm stone) |
| `surface` | `#ffffff` | Cards, panels, inputs |
| `sunken` | `#efece5` | Image wells, segmented control track, skeletons |
| `line` / `line-strong` | `#e3dfd5` `#cbc5b8` | Hairlines / input and control borders |
| `text` / `text-2` / `text-3` | `#1c2321` `#4f5754` `#767d7a` | Primary / secondary / muted text |
| `success-600` / `100` | `#1e7b4a` `#dcefe3` | In stock, paid, completed |
| `warning-600` / `100` | `#9a6512` `#fbecc9` | Few left, awaiting payment, needs attention |
| `danger-600` / `100` | `#bf3329` `#f8dfdc` | Out of stock, errors, destructive actions |
| `info-600` / `100` | `#275f9e` `#dde8f5` | Placed orders, neutral notices |
| `chart-shop` / `chart-online` | `#008a7e` `#c47f00` | Sales chart series only |

**Rules**

- Text on marigold is always `ink-950`, never white.
- Status colours are reserved for state and always come with a text label or dot: the stock badge is never colour alone.
- The chart colours passed the dataviz validator (lightness band, chroma floor, CVD separation ΔE 12.1, normal-vision ΔE above 15). Because marigold is under 3:1 against white, the chart labels its totals directly and offers a table view.
- There is a single light theme. The UI declares `color-scheme: light`.

## Typography

| Role | Font | Size / weight |
| --- | --- | --- |
| Display (h1–h4, prices, big numbers) | **Bricolage Grotesque** (variable, self-hosted via `@fontsource-variable`) | Hero 38 → 50 → 58px / 800. Page h1 28–34px / 700. Section h2 24–28px / 700. Prices 17–28px / 700 |
| Body, UI, forms, tables | **Hanken Grotesk** (variable) | Body 15px / 1.55. UI labels 13px / 600. Table 14px. Captions 12px |
| Eyebrows / table headers | Hanken Grotesk | 11–13px, uppercase, `tracking-wider`, 700 |

- Headings use `letter-spacing: -0.015em` and `line-height: 1.15`.
- All figures in prices, counts, tables and receipts use `.num` (tabular numerals).
- Currency always goes through `money()` and `Intl.NumberFormat` → `KES 1,250`. Nothing else formats money.
- Receipts use the system monospace so they read like till slips.

## Spacing and layout

- **Container:** `.container-page`, max 1280px, side padding 16px (<640), 24px (≥640) and 32px (≥1024).
- **Spacing scale:** Tailwind's 4px scale. Common values are 2/3/4/5/6 for component padding, 6/8 for gaps between panels, and 12/16 (`pt-12 md:pt-16`) between homepage sections.
- **Grids:** the product grid has 2 columns, then 3 at md and 4 at xl, with 12–16px gaps. Two-column page layouts use `minmax(0,…)` tracks so long content can never widen a column.
- **Breakpoints:** Tailwind defaults plus `xs` at 420px. The storefront category bar appears at `lg`. Below that, categories live in a drawer. The staff sidebar appears at `lg`. Below that, there's a top bar and a drawer.

## Shape and elevation

| Token | Value | Use |
| --- | --- | --- |
| `rounded-xs` | 3px | Badges, chips, small tags |
| `rounded-sm` | 4px | Buttons, inputs, selects, thumbnails |
| `rounded-md` | 6px | Cards, panels, tables |
| `rounded-lg` | 10px | Dialogs only |
| `rounded-full` | | Avatars, status dots, step markers, icon wells |

- Shadows are reserved for things that float: `shadow-pop` for toasts, tooltips and the floating hero tag, and `shadow-dialog` for dialogs and drawers. Cards use a 1px `line` border, never a shadow.
- Hovering a card darkens its border to `line-strong` or `ink-700`, and the product photo scales by 1.03. There are no lifted-card effects.

## Components

All shared primitives are in `src/components/shared/`.

| Component | Variants and states |
| --- | --- |
| `Button` | `primary` (teal), `accent` (marigold, one per view for the main purchase/complete action), `secondary` (ink), `outline`, `ghost`, `danger`, `success`, `inverse` (on ink). Sizes `sm` 32px, `md` 40px, `lg` 48px, `icon`, `icon-sm`. `loading` shows a spinner and sets `aria-busy`. Disabled is greyed with a not-allowed cursor |
| `Input`, `Textarea`, `Select` | 40px high, `line-strong` border, teal focus border plus a 2px ring. `invalid` turns the border red and pairs with the `Field` error |
| `Field` | Visible label (never placeholder-only), optional hint, error with icon and `role="alert"`, "(optional)" marker |
| `Checkbox`, radio cards | The checkout's `OptionCard` uses native radios inside a labelled card. Selected state is a teal border plus ring and a filled icon well |
| `Badge` | Tones: neutral, brand, accent, success, warning, danger, info, clay. `dot` adds a status dot |
| `StockBadge` / `LevelBadge` | In stock / Few left (≤ threshold) / Out of stock, always with a text label |
| `Price` | Display font, tabular numbers, sizes sm–xl |
| `ProductImage` | Fixed aspect-ratio box with the image absolutely positioned inside (cover or contain). Resolves IndexedDB uploads. Falls back to "No photo yet" or "Photo unavailable" |
| `ProductCard` / `ProductGrid` | Photo, brand eyebrow, two-line name, price ("from" for ranges), option count, quick add (single variant) or "Choose". Badges for New and stock level. Includes a skeleton version |
| `Dialog` | Portal, overlay `ink-950/55`, focus trap, Esc to close, focus returns to the trigger, `aria-modal` with labelledby/describedby. Becomes a bottom sheet on mobile |
| `Drawer` | Same focus behaviour. Slides in from the left (navigation) or the right (cart, filters, order detail) |
| `ConfirmDialog` | Every destructive action: cancel order, delete product, deactivate staff, reset demo |
| `Toast` | Bottom-right (bottom-centre on mobile), ink surface, success/error/info icon, optional action. `aria-live` |
| `Segmented` | Tabs for order status, inventory view, payment method, chart/table |
| `QtyStepper` | −/value/+ with min/max clamping. Typed input is clamped too |
| `EmptyState`, `ErrorState`, `Skeleton`, `Spinner` | Every data view has a loading skeleton and an empty state |
| `OrderTracker` | Shows only the steps for that fulfilment method (pickup or delivery). Done steps are filled teal and the current step gets a halo. Cancelled orders get their own banner |

## Interaction patterns

- **Loading:** pages render skeletons until browser data loads, then swap in place.
- **Validation:** checked on submit, errors are shown inline next to each field, and focus moves to the first invalid field. Business rules (stock, payment, permissions) are checked again inside the action and reported in a toast.
- **Confirmation:** destructive or irreversible actions always ask first and say what will happen ("items go back into stock").
- **Feedback:** every successful mutation shows a toast. Add to cart offers a "View cart" action.
- **Demo honesty:** the staff app has a permanent marigold banner, "Demo mode · Sample data · Simulated payments". The M-Pesa prompt is labelled as a simulation. Customers don't see demo warnings anywhere else.

## Responsive rules

- Every page is checked at 1440px and 390px with no horizontal page scroll (`scripts/responsive-sweep.js`).
- Storefront: the header collapses to menu, logo and cart, with search on its own full-width row. Filters move into a drawer. The product page gets a sticky "Buy now" bar.
- Staff: the sidebar becomes a top bar plus drawer. Tables become stacked cards below `md` (orders, inventory). The POS sale panel becomes a sticky bottom button that opens a drawer.
- Dialogs become bottom sheets under 640px.

## Accessibility

- One `h1` per page. There's a skip link to `#main`, and landmarks (`header`, `nav`, `main`, `aside`, `footer`) are labelled.
- Every input has a `<label>`. Hints and errors are linked with `aria-describedby`.
- Visible focus everywhere: 2px `brand-500` outline with a 2px offset.
- Dialogs and drawers are fully keyboard-operable.
- Images have useful alt text where they carry meaning, and empty alt where they're decorative (cards are labelled by their headings).
- Colour is never the only signal: stock, status and payment always have text.
- Contrast: body text on canvas and surface is above 7:1. `text-3` passes 4.5:1 on white.

## Motion

- Motion uses transform and opacity only: fade-in, a rise of 8px over 200ms, drawer slides at 220ms, and the photo zoom on card hover.
- No decorative or looping animation, except the skeleton shimmer and loading spinners.
- `prefers-reduced-motion: reduce` turns all animation and transitions off.
- There's no animation on checkout or POS beyond dialog entry.

## Print

- `@media print` prints only `.print-area` (the POS receipt), formatted for 80mm thermal paper.

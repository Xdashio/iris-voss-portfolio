import type { AppState, CartLine, Order, Product, ProductVariant } from "@/types";

export const DAY = 86_400_000;

export function startOfDay(d: Date | number): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

export const totalStock = (p: Product) => p.variants.reduce((s, v) => s + v.stock, 0);

/** Variants a customer can see: priced ones only (unpriced drafts stay hidden). */
export const publicVariants = (p: Product) => p.variants.filter((v) => v.price > 0);

export const isPublic = (p: Product) => p.published && publicVariants(p).length > 0;

export function priceRange(p: Product): [number, number] {
  const prices = publicVariants(p).map((v) => v.price);
  return prices.length ? [Math.min(...prices), Math.max(...prices)] : [0, 0];
}

export type StockLevel = "in" | "low" | "out";
export function stockLevel(stock: number, threshold: number): StockLevel {
  return stock <= 0 ? "out" : stock <= threshold ? "low" : "in";
}
export function productStockLevel(p: Product, threshold: number): StockLevel {
  const vs = publicVariants(p).length ? publicVariants(p) : p.variants;
  if (vs.every((v) => v.stock <= 0)) return "out";
  if (vs.some((v) => v.stock > 0 && v.stock <= threshold) && vs.every((v) => v.stock <= threshold)) return "low";
  return "in";
}

export function findVariant(state: Pick<AppState, "products">, productId: string, variantId: string):
  { product: Product; variant: ProductVariant } | null {
  const product = state.products.find((p) => p.id === productId);
  const variant = product?.variants.find((v) => v.id === variantId);
  return product && variant ? { product, variant } : null;
}

export interface CartRow {
  line: CartLine;
  product: Product;
  variant: ProductVariant;
  lineTotal: number;
  /** quantity exceeds what is on the shelf now */
  overStock: boolean;
  unavailable: boolean;
}

export function cartRows(state: Pick<AppState, "products">, cart: CartLine[]): CartRow[] {
  const rows: CartRow[] = [];
  for (const line of cart) {
    const hit = findVariant(state, line.productId, line.variantId);
    if (!hit) continue;
    const unavailable = !isPublic(hit.product) || hit.variant.price <= 0 || hit.variant.stock <= 0;
    rows.push({
      line, ...hit,
      lineTotal: hit.variant.price * line.qty,
      overStock: line.qty > hit.variant.stock,
      unavailable,
    });
  }
  return rows;
}

export const cartCount = (cart: CartLine[]) => cart.reduce((s, l) => s + l.qty, 0);

/** Revenue-recognised online orders: paid and not cancelled. */
export const countsAsSale = (o: Order) => o.status !== "cancelled" && o.paymentStatus === "paid";

export interface DaySales { day: number; label: string; pos: number; online: number }

export function salesByDay(state: AppState, days = 7, now = Date.now()): DaySales[] {
  const today = startOfDay(now);
  const out: DaySales[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = today - i * DAY;
    out.push({ day, label: new Date(day).toLocaleDateString("en-KE", { weekday: "short" }), pos: 0, online: 0 });
  }
  const idx = (iso: string) => out.findIndex((d) => d.day === startOfDay(new Date(iso)));
  for (const s of state.posSales) { const i = idx(s.createdAt); if (i >= 0) out[i].pos += s.total; }
  for (const o of state.orders) {
    if (!countsAsSale(o)) continue;
    const i = idx(o.paidAt ?? o.createdAt);
    if (i >= 0) out[i].online += o.total;
  }
  return out;
}

export function topSellers(state: AppState, days = 7, now = Date.now(), limit = 5) {
  const since = startOfDay(now) - (days - 1) * DAY;
  const map = new Map<string, { productId: string; name: string; image: string; qty: number; revenue: number }>();
  const add = (items: Order["items"]) => items.forEach((it) => {
    const e = map.get(it.productId) ?? { productId: it.productId, name: it.name, image: it.image, qty: 0, revenue: 0 };
    e.qty += it.qty; e.revenue += it.qty * it.unitPrice;
    map.set(it.productId, e);
  });
  state.posSales.filter((s) => new Date(s.createdAt).getTime() >= since).forEach((s) => add(s.items));
  state.orders.filter((o) => o.status !== "cancelled" && new Date(o.createdAt).getTime() >= since).forEach((o) => add(o.items));
  return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

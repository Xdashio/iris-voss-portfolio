"use client";

import type {
  ActivityEntry, AppState, CartLine, DeliveryZone, Fulfilment, MovementType, Order, OrderItem, OrderStatus,
  PaymentMethod, PosPayment, PosSale, Product, Role, Settings, Staff,
} from "@/types";
import { commit, currentStaff, getSnapshot, resetAll, setSnapshot } from "./store";
import { assertCan, can } from "./permissions";
import { fakeMpesaRef, uid } from "./ids";
import { STATUS_LABEL, transitionError } from "./orders";
import { findVariant, isPublic } from "./calculations";
import { isMpesaCode, isPin, normalizeKePhone } from "./validation";

/** A user-facing business rule violation. Message is safe to show in a toast. */
export class DomainError extends Error {
  constructor(message: string) { super(message); this.name = "DomainError"; }
}
function fail(msg: string): never { throw new DomainError(msg); }

const nowIso = () => new Date().toISOString();

function actor(): Staff | null { return currentStaff(getSnapshot()); }

function log(d: AppState, a: Omit<ActivityEntry, "id" | "at">) {
  d.activity.unshift({ id: uid("act"), at: nowIso(), ...a });
  if (d.activity.length > 300) d.activity.length = 300;
}

/** The single place stock changes. Every change writes a movement. */
function moveStock(d: AppState, productId: string, variantId: string, change: number, type: MovementType,
  reason: string, staffName: string, ref?: string) {
  const hit = findVariant(d, productId, variantId) ?? fail("That product no longer exists.");
  const { product, variant } = hit;
  const before = variant.stock;
  const after = before + change;
  if (after < 0) fail(`Only ${before} × ${product.name} (${variant.label}) in stock.`);
  variant.stock = after;
  variant.updatedAt = nowIso();
  d.movements.unshift({
    id: uid("mv"), at: nowIso(), productId, variantId, productName: product.name, variantLabel: variant.label,
    type, change, before, after, reason, staffName, ref,
  });
}

function toItems(d: AppState, lines: CartLine[]): OrderItem[] {
  return lines.map((l) => {
    const hit = findVariant(d, l.productId, l.variantId) ?? fail("An item in your cart is no longer available.");
    const { product: p, variant: v } = hit;
    if (!Number.isInteger(l.qty) || l.qty < 1) fail("Invalid quantity.");
    if (v.price <= 0) fail(`${p.name} (${v.label}) is not for sale yet.`);
    if (l.qty > v.stock) fail(v.stock === 0
      ? `${p.name} (${v.label}) just sold out.`
      : `Only ${v.stock} × ${p.name} (${v.label}) left. Please reduce the quantity.`);
    return { productId: p.id, variantId: v.id, name: p.name, variantLabel: v.label, sku: v.sku, image: p.images[0] ?? "", unitPrice: v.price, qty: l.qty };
  });
}

/* ───────────────────────────── Cart ───────────────────────────── */

export function addToCart(productId: string, variantId: string, qty: number): { added: number; capped: boolean } {
  const s = getSnapshot();
  if (!s) return { added: 0, capped: false };
  const hit = findVariant(s.data, productId, variantId);
  if (!hit || !isPublic(hit.product) || hit.variant.price <= 0) throw new DomainError("This item is not available.");
  const existing = s.cart.find((l) => l.productId === productId && l.variantId === variantId);
  const have = existing?.qty ?? 0;
  const room = Math.max(0, hit.variant.stock - have);
  if (room === 0) throw new DomainError(hit.variant.stock === 0 ? "Out of stock." : `You already have all ${hit.variant.stock} in your cart.`);
  const added = Math.min(qty, room);
  setSnapshot((x) => ({
    ...x,
    cart: existing
      ? x.cart.map((l) => (l === existing ? { ...l, qty: l.qty + added } : l))
      : [...x.cart, { productId, variantId, qty: added }],
  }));
  return { added, capped: added < qty };
}

export function setCartQty(productId: string, variantId: string, qty: number) {
  const s = getSnapshot();
  if (!s) return;
  const hit = findVariant(s.data, productId, variantId);
  const max = hit?.variant.stock ?? 0;
  const q = Math.max(0, Math.min(qty, max));
  setSnapshot((x) => ({
    ...x,
    cart: q === 0
      ? x.cart.filter((l) => !(l.productId === productId && l.variantId === variantId))
      : x.cart.map((l) => (l.productId === productId && l.variantId === variantId ? { ...l, qty: q } : l)),
  }));
}

export function removeFromCart(productId: string, variantId: string) { setCartQty(productId, variantId, 0); }

/* ─────────────────────────── Checkout ─────────────────────────── */

export interface CheckoutInput {
  name: string;
  phone: string;
  email?: string;
  fulfilment: Fulfilment;
  zoneId?: string;
  deliveryNote?: string;
  paymentMethod: PaymentMethod;
}

/**
 * Creates the order and deducts stock exactly once. Re-submitting with the
 * same checkout key returns the existing order instead of creating another.
 */
export function placeOrder(input: CheckoutInput): Order {
  const s = getSnapshot() ?? fail("Store not ready");
  const dup = s.data.orders.find((o) => o.checkoutKey === s.checkoutKey);
  if (dup) return dup;
  if (s.cart.length === 0) fail("Your cart is empty.");
  const phone = normalizeKePhone(input.phone) ?? fail("Enter a valid Kenyan mobile number.");
  if (input.name.trim().length < 2) fail("Enter your name.");
  if (input.fulfilment === "delivery" && input.paymentMethod === "cash") fail("Cash is only accepted for shop pickup.");

  const order = commit((d) => {
    let zone: DeliveryZone | undefined;
    if (input.fulfilment === "delivery") {
      zone = d.settings.zones.find((z) => z.id === input.zoneId) ?? fail("Choose a delivery zone.");
    }
    const items = toItems(d, s.cart);
    d.counters.order += 1;
    const number = `DL-${d.counters.order}`;
    const subtotal = items.reduce((t, i) => t + i.unitPrice * i.qty, 0);
    const deliveryFee = zone?.fee ?? 0;
    const at = nowIso();
    const o: Order = {
      id: uid("ord"), number, checkoutKey: s.checkoutKey, createdAt: at,
      customer: { name: input.name.trim(), phone, email: input.email?.trim() || undefined },
      items, fulfilment: input.fulfilment, zoneId: zone?.id, zoneName: zone?.name,
      deliveryNote: input.deliveryNote?.trim() || undefined,
      deliveryFee, subtotal, total: subtotal + deliveryFee,
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentMethod === "cash" ? "unpaid" : "pending",
      status: "placed", history: [{ status: "placed", at, by: "Customer" }], restocked: false,
    };
    items.forEach((i) => moveStock(d, i.productId, i.variantId, -i.qty, "online_sale", "Online order", "System", number));
    d.orders.unshift(o);
    log(d, { actor: o.customer.name, text: `placed order ${number}`, kind: "order" });
    return o;
  });
  setSnapshot((x) => ({ ...x, cart: [], checkoutKey: uid("chk") }));
  return order;
}

/**
 * Simulated M-Pesa STK push result. No money moves. A paid order cannot be
 * confirmed twice.
 */
export function simulateMpesaResult(orderId: string, outcome: "success" | "failed"): Order {
  return commit((d) => {
    const o = d.orders.find((x) => x.id === orderId) ?? fail("Order not found.");
    if (o.paymentMethod === "cash") fail("This order is paid in cash at pickup.");
    if (o.paymentStatus === "paid") fail("This order is already paid.");
    if (o.status === "cancelled") fail("This order was cancelled.");
    if (outcome === "success") {
      o.paymentStatus = "paid";
      o.paymentRef = fakeMpesaRef();
      o.paidAt = nowIso();
      log(d, { actor: "M-Pesa (simulated)", text: `confirmed payment for ${o.number}`, kind: "payment" });
    } else {
      o.paymentStatus = "failed";
    }
    return structuredClone(o);
  });
}

/* ─────────────────────────── Staff: orders ─────────────────────────── */

export function advanceOrder(orderId: string, to: OrderStatus, note?: string): Order {
  const a = actor();
  assertCan(a, "orders.manage");
  return commit((d) => {
    const o = d.orders.find((x) => x.id === orderId) ?? fail("Order not found.");
    if (to === "cancelled") fail("Use Cancel order to cancel.");
    const err = transitionError(o, to);
    if (err) fail(err);
    o.status = to;
    o.history.push({ status: to, at: nowIso(), by: a.name, note });
    log(d, { actor: a.name, text: `marked ${o.number} ${STATUS_LABEL[to].toLowerCase()}`, kind: "order" });
    return structuredClone(o);
  });
}

export function recordOrderPayment(orderId: string, ref?: string): Order {
  const a = actor();
  assertCan(a, "orders.manage");
  return commit((d) => {
    const o = d.orders.find((x) => x.id === orderId) ?? fail("Order not found.");
    if (o.status === "cancelled") fail("This order was cancelled.");
    if (o.paymentStatus === "paid") fail("Payment is already recorded for this order.");
    if (o.paymentMethod !== "cash") {
      const code = (ref ?? "").trim().toUpperCase();
      if (!isMpesaCode(code)) fail("Enter the 10-character M-Pesa confirmation code.");
      o.paymentRef = code;
    } else {
      o.paymentRef = "CASH";
    }
    o.paymentStatus = "paid";
    o.paidAt = nowIso();
    log(d, { actor: a.name, text: `recorded ${o.paymentMethod === "cash" ? "cash" : "M-Pesa"} payment for ${o.number}`, kind: "payment" });
    return structuredClone(o);
  });
}

/** Cancels an order and returns its stock to the shelf exactly once. */
export function cancelOrder(orderId: string, reason: string): Order {
  const a = actor();
  assertCan(a, "orders.manage");
  if (!reason.trim()) fail("Give a reason for cancelling.");
  return commit((d) => {
    const o = d.orders.find((x) => x.id === orderId) ?? fail("Order not found.");
    const err = transitionError(o, "cancelled");
    if (err) fail(err);
    o.status = "cancelled";
    o.history.push({ status: "cancelled", at: nowIso(), by: a.name, note: reason.trim() });
    if (!o.restocked) {
      o.items.forEach((i) => {
        if (findVariant(d, i.productId, i.variantId))
          moveStock(d, i.productId, i.variantId, i.qty, "restock_cancel", `Cancelled: ${reason.trim()}`, a.name, o.number);
      });
      o.restocked = true;
    }
    if (o.paymentStatus === "paid") o.paymentStatus = "refunded";
    log(d, { actor: a.name, text: `cancelled ${o.number} and restocked items`, kind: "order" });
    return structuredClone(o);
  });
}

/* ─────────────────────────── Staff: auth ─────────────────────────── */

export function login(username: string, pin: string): Staff {
  const s = getSnapshot() ?? fail("Store not ready");
  const st = s.data.staff.find((x) => x.username.toLowerCase() === username.trim().toLowerCase());
  if (!st || st.pin !== pin) fail("Username or PIN is incorrect.");
  if (!st.active) fail("This account is deactivated. Ask the owner to reactivate it.");
  setSnapshot((x) => ({ ...x, sessionStaffId: st.id }));
  return st;
}

export function logout() { setSnapshot((x) => ({ ...x, sessionStaffId: null })); }

/* ─────────────────────────── Products ─────────────────────────── */

export interface VariantInput { id?: string; label: string; sku: string; price: number | null; openingStock: number }
export interface ProductInput {
  id?: string;
  name: string;
  categoryId: string;
  brand: string;
  description: string;
  images: string[];
  published: boolean;
  featured: boolean;
  variants: VariantInput[];
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function saveProduct(input: ProductInput): Product {
  const a = actor();
  assertCan(a, "products.edit");
  const pricesAllowed = can(a, "prices.edit");
  if (input.name.trim().length < 3) fail("Product name is too short.");
  if (input.variants.length === 0) fail("Add at least one variant.");
  const labels = input.variants.map((v) => v.label.trim().toLowerCase());
  if (labels.some((l) => !l)) fail("Every variant needs a label.");
  if (new Set(labels).size !== labels.length) fail("Variant labels must be different.");

  return commit((d) => {
    if (!d.categories.some((c) => c.id === input.categoryId)) fail("Choose a category.");
    const at = nowIso();
    let p = input.id ? d.products.find((x) => x.id === input.id) : undefined;
    if (input.id && !p) fail("Product not found.");
    const isNew = !p;
    if (!p) {
      const n = d.products.length + 1;
      let sku = `DL-${String(n).padStart(3, "0")}`;
      while (d.products.some((x) => x.sku === sku)) sku = `DL-${Math.floor(100 + Math.random() * 900)}`;
      p = { id: uid("prd"), slug: "", sku, categoryId: input.categoryId, name: "", brand: "", description: "", images: [],
        published: false, featured: false, createdAt: at, updatedAt: at, variants: [] };
      d.products.unshift(p);
    }
    let slug = slugify(input.name) || p.id;
    if (d.products.some((x) => x.slug === slug && x.id !== p!.id)) slug = `${slug}-${p.id.slice(-4)}`;
    Object.assign(p, {
      slug, name: input.name.trim(), categoryId: input.categoryId, brand: input.brand.trim() || "Generic",
      description: input.description.trim(), images: input.images, featured: input.featured, updatedAt: at,
      nameUnconfirmed: p.nameUnconfirmed && p.name === input.name.trim() ? true : undefined,
    });

    // Variants: keep stock (only Inventory changes it), add new ones with opening stock.
    const keep = new Set(input.variants.filter((v) => v.id).map((v) => v.id));
    p.variants = p.variants.filter((v) => keep.has(v.id));
    input.variants.forEach((vi, k) => {
      const existing = vi.id ? p!.variants.find((v) => v.id === vi.id) : undefined;
      const sku = vi.sku.trim() || `${p!.sku}-${k + 1}`;
      if (d.products.some((x) => x.variants.some((v) => v.sku === sku && v.id !== vi.id))) fail(`SKU ${sku} is already used.`);
      if (pricesAllowed && (vi.price === null || vi.price < 0)) fail(`Enter a price for "${vi.label}".`);
      if (existing) {
        existing.label = vi.label.trim();
        existing.sku = sku;
        if (pricesAllowed && vi.price !== null) existing.price = vi.price;
        existing.updatedAt = at;
      } else {
        const v = { id: uid("var"), label: vi.label.trim(), sku, price: pricesAllowed ? vi.price ?? 0 : 0, stock: 0, updatedAt: at };
        p!.variants.push(v);
        if (vi.openingStock > 0) moveStock(d, p!.id, v.id, vi.openingStock, "opening", "Opening stock", a.name);
      }
    });
    // Order variants as submitted
    const order = input.variants.map((vi) => vi.id ?? p!.variants.find((v) => v.label === vi.label.trim())?.id);
    p.variants.sort((x, y) => order.indexOf(x.id) - order.indexOf(y.id));

    p.published = input.published && p.variants.some((v) => v.price > 0);
    if (input.published && !p.published) {
      // Not an error for stock clerks: the product is saved as a draft for the owner to price.
      log(d, { actor: a.name, text: `saved ${p.name} as a draft (needs prices before publishing)`, kind: "product" });
    } else {
      log(d, { actor: a.name, text: `${isNew ? "added" : "updated"} ${p.name}`, kind: "product" });
    }
    return structuredClone(p);
  });
}

export function setPublished(productId: string, published: boolean): Product {
  const a = actor();
  assertCan(a, "products.edit");
  return commit((d) => {
    const p = d.products.find((x) => x.id === productId) ?? fail("Product not found.");
    if (published && !p.variants.some((v) => v.price > 0)) fail("Set a price on at least one variant before publishing.");
    p.published = published;
    p.updatedAt = nowIso();
    log(d, { actor: a.name, text: `${published ? "published" : "hid"} ${p.name}`, kind: "product" });
    return structuredClone(p);
  });
}

export function deleteProduct(productId: string) {
  const a = actor();
  assertCan(a, "products.delete");
  commit((d) => {
    const p = d.products.find((x) => x.id === productId) ?? fail("Product not found.");
    d.products = d.products.filter((x) => x.id !== productId);
    log(d, { actor: a.name, text: `deleted ${p.name}`, kind: "product" });
  });
  setSnapshot((x) => ({ ...x, cart: x.cart.filter((l) => l.productId !== productId) }));
}

/* ─────────────────────────── Inventory ─────────────────────────── */

export type AdjustKind = "stock_in" | "stock_out" | "adjustment";

export function adjustStock(productId: string, variantId: string, kind: AdjustKind, qty: number, reason: string) {
  const a = actor();
  assertCan(a, "inventory.adjust");
  if (!Number.isInteger(qty) || qty < 0) fail("Enter a whole number.");
  if (kind !== "adjustment" && qty === 0) fail("Quantity must be at least 1.");
  if (!reason.trim()) fail("Give a reason.");
  return commit((d) => {
    const hit = findVariant(d, productId, variantId) ?? fail("Choose a product and variant.");
    const change = kind === "stock_in" ? qty : kind === "stock_out" ? -qty : qty - hit.variant.stock;
    if (kind === "adjustment" && change === 0) fail("The count matches current stock. Nothing to change.");
    moveStock(d, productId, variantId, change, kind, reason.trim(), a.name);
    const verb = kind === "stock_in" ? `added ${qty}` : kind === "stock_out" ? `removed ${qty}` : `counted ${qty} (was ${hit.variant.stock - change})`;
    log(d, { actor: a.name, text: `${verb} · ${hit.product.name} (${hit.variant.label})`, kind: "stock" });
    return { before: hit.variant.stock - change, after: hit.variant.stock };
  });
}

/* ─────────────────────────── POS ─────────────────────────── */

export interface PosInput {
  key: string;
  lines: CartLine[];
  payment: PosPayment;
  tendered?: number;
  mpesaRef?: string;
}

export function completeSale(input: PosInput): PosSale {
  const a = actor();
  assertCan(a, "pos.use");
  const s = getSnapshot() ?? fail("Store not ready");
  const dup = s.data.posSales.find((x) => x.id === input.key);
  if (dup) return dup;
  if (input.lines.length === 0) fail("Add items to the sale.");
  return commit((d) => {
    const items = toItems(d, input.lines);
    const total = items.reduce((t, i) => t + i.unitPrice * i.qty, 0);
    let tendered: number | undefined, change: number | undefined, mpesaRef: string | undefined;
    if (input.payment === "cash") {
      tendered = input.tendered ?? 0;
      if (!Number.isFinite(tendered) || tendered < total) fail("Cash tendered is less than the total.");
      change = tendered - total;
    } else {
      mpesaRef = (input.mpesaRef ?? "").trim().toUpperCase();
      if (!isMpesaCode(mpesaRef)) fail("Enter the 10-character M-Pesa confirmation code.");
      if (d.posSales.some((x) => x.mpesaRef === mpesaRef) || d.orders.some((o) => o.paymentRef === mpesaRef))
        fail("That M-Pesa code has already been used.");
    }
    d.counters.receipt += 1;
    const sale: PosSale = {
      id: input.key, receiptNo: `R-${d.counters.receipt}`, createdAt: nowIso(), cashierId: a.id, cashierName: a.name,
      items, total, payment: input.payment, tendered, change, mpesaRef,
    };
    items.forEach((i) => moveStock(d, i.productId, i.variantId, -i.qty, "pos_sale", "Shop sale", a.name, sale.receiptNo));
    d.posSales.unshift(sale);
    log(d, { actor: a.name, text: `sold ${items.reduce((t, i) => t + i.qty, 0)} item(s) · ${sale.receiptNo}`, kind: "pos" });
    return sale;
  });
}

/* ─────────────────────────── Staff management ─────────────────────────── */

export interface StaffInput { id?: string; name: string; username: string; role: Role; phone?: string; pin?: string }

export function saveStaff(input: StaffInput): Staff {
  const a = actor();
  assertCan(a, "staff.manage");
  if (input.name.trim().length < 2) fail("Enter the staff member's name.");
  const username = input.username.trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,20}$/.test(username)) fail("Username: 3–20 letters, numbers, dots or dashes.");
  return commit((d) => {
    if (d.staff.some((x) => x.username === username && x.id !== input.id)) fail("That username is taken.");
    let st = input.id ? d.staff.find((x) => x.id === input.id) : undefined;
    if (input.id && !st) fail("Staff member not found.");
    if (st && st.id === a.id && input.role !== "owner") fail("You cannot remove your own owner role.");
    if (!st) {
      if (!input.pin || !isPin(input.pin)) fail("Set a 4-digit PIN.");
      st = { id: uid("staff"), name: "", username, pin: input.pin, role: input.role, active: true, createdAt: nowIso() };
      d.staff.push(st);
      log(d, { actor: a.name, text: `added ${input.name.trim()} as ${input.role}`, kind: "staff" });
    } else {
      log(d, { actor: a.name, text: `updated ${input.name.trim()}`, kind: "staff" });
    }
    st.name = input.name.trim();
    st.username = username;
    st.role = input.role;
    st.phone = input.phone ? normalizeKePhone(input.phone) ?? fail("Phone number is not a valid Kenyan number.") : undefined;
    return structuredClone(st);
  });
}

export function setStaffActive(staffId: string, active: boolean) {
  const a = actor();
  assertCan(a, "staff.manage");
  commit((d) => {
    const st = d.staff.find((x) => x.id === staffId) ?? fail("Staff member not found.");
    if (st.id === a.id) fail("You cannot deactivate your own account.");
    if (!active && st.role === "owner" && d.staff.filter((x) => x.role === "owner" && x.active).length <= 1)
      fail("At least one owner must stay active.");
    st.active = active;
    log(d, { actor: a.name, text: `${active ? "reactivated" : "deactivated"} ${st.name}`, kind: "staff" });
  });
}

export function resetPin(staffId: string, pin: string) {
  const a = actor();
  assertCan(a, "staff.manage");
  if (!isPin(pin)) fail("PIN must be 4 digits.");
  commit((d) => {
    const st = d.staff.find((x) => x.id === staffId) ?? fail("Staff member not found.");
    st.pin = pin;
    log(d, { actor: a.name, text: `reset the PIN for ${st.name}`, kind: "staff" });
  });
}

/* ─────────────────────────── Settings ─────────────────────────── */

export function saveSettings(next: Settings) {
  const a = actor();
  assertCan(a, "settings.manage");
  if (!next.shopName.trim()) fail("Shop name is required.");
  if (!Number.isInteger(next.lowStockThreshold) || next.lowStockThreshold < 0 || next.lowStockThreshold > 999)
    fail("Low-stock threshold must be a whole number from 0 to 999.");
  if (next.zones.length === 0) fail("Keep at least one delivery zone.");
  next.zones.forEach((z) => {
    if (!z.name.trim()) fail("Every zone needs a name.");
    if (!Number.isInteger(z.fee) || z.fee < 0) fail(`Fee for ${z.name} must be a whole number of shillings.`);
  });
  if (next.whatsapp && !normalizeKePhone(next.whatsapp)) fail("WhatsApp number is not a valid Kenyan number.");
  commit((d) => {
    d.settings = { ...next, whatsapp: next.whatsapp ? normalizeKePhone(next.whatsapp)! : "", currency: "KES" };
    log(d, { actor: a.name, text: "updated shop settings", kind: "settings" });
  });
}

export function resetDemoData() {
  const a = actor();
  assertCan(a, "settings.manage");
  resetAll();
}

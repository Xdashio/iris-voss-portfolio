import type { ActivityEntry, AppState, Order, OrderItem, OrderStatus, PosSale, Product, Staff, StockMovement } from "@/types";
import { CATEGORIES, buildSeedProducts } from "./catalogue";
import { fakeMpesaRef, prng } from "@/lib/ids";
import { FLOW } from "@/lib/orders";

export const STATE_VERSION = 3;

const CUSTOMERS: [string, string][] = [
  ["Grace Njeri", "254712408833"], ["Peter Kamau", "254722615402"], ["Mercy Achieng", "254701338176"],
  ["John Mutua", "254733902215"], ["Esther Wambui", "254745118090"], ["Daniel Kiprop", "254110462871"],
  ["Lucy Nyambura", "254798201334"], ["Samuel Omondi", "254726550918"], ["Ann Mumbi", "254757042649"],
  ["Joseph Barasa", "254115920487"], ["Ruth Jepchirchir", "254768331905"], ["Moses Kariuki", "254720774162"],
];

export function seedStaff(now: Date): Staff[] {
  const at = new Date(now.getTime() - 120 * 86_400_000).toISOString();
  return [
    { id: "staff_owner", name: "Shop Owner", username: "owner", pin: "1234", role: "owner", active: true, phone: "254700000000", createdAt: at },
    { id: "staff_cashier", name: "Brian Otieno", username: "cashier", pin: "2345", role: "cashier", active: true, phone: "254711000001", createdAt: at },
    { id: "staff_stock", name: "Faith Chebet", username: "stock", pin: "3456", role: "stock", active: true, phone: "254711000002", createdAt: at },
    { id: "staff_kevin", name: "Kevin Mwangi", username: "kevin", pin: "4567", role: "cashier", active: false, phone: "254711000003", createdAt: at },
  ];
}

export function seedSettings(): AppState["settings"] {
  return {
    shopName: "Duka Letu",
    tagline: "Electronics, hardware & home goods",
    phone: "0700 000 000",
    whatsapp: "254700000000",
    email: "hello@dukaletu.example",
    address: "Shop address to be confirmed",
    hours: "Mon–Sat 8:00–19:00 · Sun 10:00–16:00",
    tillNumber: "000000",
    paybillNumber: "000000",
    paybillAccountFormat: "Order number, e.g. DL-10024",
    zones: [
      { id: "zone_1", name: "Zone 1", areas: "Town centre and nearby estates", fee: 100 },
      { id: "zone_2", name: "Zone 2", areas: "Outer estates", fee: 200 },
      { id: "zone_3", name: "Zone 3", areas: "Edge of town", fee: 350 },
    ],
    lowStockThreshold: 5,
    currency: "KES",
  };
}

function item(p: Product, vi: number, qty: number): OrderItem {
  const v = p.variants[Math.min(vi, p.variants.length - 1)];
  return { productId: p.id, variantId: v.id, name: p.name, variantLabel: v.label, sku: v.sku, image: p.images[0], unitPrice: v.price, qty };
}

/**
 * Builds the demonstration dataset. Stock levels in the catalogue are treated
 * as "after" the seeded history, so history does not change stock counts.
 */
export function buildSeed(now = new Date()): AppState {
  const rand = prng(20261102);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
  const products = buildSeedProducts(now);
  const staff = seedStaff(now);
  const settings = seedSettings();
  const cashier = staff[1];
  const today0 = new Date(now); today0.setHours(0, 0, 0, 0);
  const at = (daysAgo: number, hour: number, min = 0) => {
    const d = new Date(today0.getTime() - daysAgo * 86_400_000);
    d.setHours(hour, min, 0, 0);
    // never in the future
    return new Date(Math.min(d.getTime(), now.getTime() - (daysAgo === 0 ? 5 * 60_000 : 0))).toISOString();
  };
  const popular = products.filter((p) => p.variants[0].price < 2000);

  const movements: StockMovement[] = [];
  const activity: ActivityEntry[] = [];
  const mv = (iso: string, it: OrderItem, type: StockMovement["type"], reason: string, staffName: string, ref: string) => {
    const p = products.find((x) => x.id === it.productId)!;
    const v = p.variants.find((x) => x.id === it.variantId)!;
    movements.push({
      id: `mv_seed_${movements.length}`, at: iso, productId: p.id, variantId: v.id, productName: p.name,
      variantLabel: v.label, type, change: -it.qty, before: v.stock + it.qty, after: v.stock, reason, staffName, ref,
    });
  };

  // POS sales: last 7 days
  const posSales: PosSale[] = [];
  let receipt = 5000;
  for (let d = 6; d >= 0; d--) {
    const n = d === 0 ? 4 : 5 + Math.floor(rand() * 5);
    for (let k = 0; k < n; k++) {
      const hour = 8 + Math.floor((k / n) * 10);
      if (d === 0 && hour > now.getHours()) continue;
      const lines = 1 + Math.floor(rand() * 2);
      const items: OrderItem[] = [];
      for (let j = 0; j < lines; j++) {
        const p = pick(popular);
        if (items.some((i) => i.productId === p.id)) continue;
        items.push(item(p, Math.floor(rand() * p.variants.length), p.variants[0].price < 300 ? 1 + Math.floor(rand() * 4) : 1));
      }
      const total = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
      const cash = rand() < 0.45;
      const created = at(d, hour, Math.floor(rand() * 59));
      receipt++;
      const tendered = cash ? Math.ceil(total / 100) * 100 + (rand() < 0.5 ? 0 : 500) : undefined;
      const sale: PosSale = {
        id: `pos_seed_${receipt}`, receiptNo: `R-${receipt}`, createdAt: created, cashierId: cashier.id, cashierName: cashier.name,
        items, total, payment: cash ? "cash" : "mpesa",
        tendered, change: tendered !== undefined ? tendered - total : undefined,
        mpesaRef: cash ? undefined : fakeMpesaRef(rand),
      };
      posSales.push(sale);
      items.forEach((it) => mv(created, it, "pos_sale", "Shop sale", cashier.name, sale.receiptNo));
    }
  }

  // Online orders
  const orders: Order[] = [];
  let num = 10000;
  const plan: { d: number; h: number; ful: "pickup" | "delivery"; pay: Order["paymentMethod"]; status: OrderStatus; paid: boolean }[] = [
    { d: 6, h: 10, ful: "delivery", pay: "mpesa_till", status: "delivered", paid: true },
    { d: 6, h: 15, ful: "pickup", pay: "cash", status: "collected", paid: true },
    { d: 5, h: 11, ful: "pickup", pay: "mpesa_paybill", status: "collected", paid: true },
    { d: 5, h: 17, ful: "delivery", pay: "mpesa_till", status: "delivered", paid: true },
    { d: 4, h: 9, ful: "delivery", pay: "mpesa_till", status: "cancelled", paid: false },
    { d: 4, h: 13, ful: "pickup", pay: "mpesa_till", status: "collected", paid: true },
    { d: 3, h: 12, ful: "delivery", pay: "mpesa_paybill", status: "delivered", paid: true },
    { d: 2, h: 10, ful: "pickup", pay: "cash", status: "collected", paid: true },
    { d: 2, h: 16, ful: "delivery", pay: "mpesa_till", status: "delivered", paid: true },
    { d: 1, h: 11, ful: "pickup", pay: "mpesa_till", status: "ready_for_pickup", paid: true },
    { d: 1, h: 18, ful: "delivery", pay: "mpesa_paybill", status: "out_for_delivery", paid: true },
    { d: 0, h: 8, ful: "pickup", pay: "cash", status: "packed", paid: false },
    { d: 0, h: 9, ful: "delivery", pay: "mpesa_till", status: "placed", paid: true },
    { d: 0, h: 10, ful: "pickup", pay: "mpesa_till", status: "placed", paid: true },
  ];
  plan.forEach((o, i) => {
    num++;
    const [name, phone] = CUSTOMERS[i % CUSTOMERS.length];
    const items: OrderItem[] = [];
    const lines = 1 + Math.floor(rand() * 3);
    for (let j = 0; j < lines; j++) {
      const p = pick(products);
      if (items.some((x) => x.productId === p.id)) continue;
      items.push(item(p, Math.floor(rand() * p.variants.length), p.variants[0].price < 400 ? 2 : 1));
    }
    const zone = o.ful === "delivery" ? settings.zones[i % 3] : undefined;
    const subtotal = items.reduce((s, x) => s + x.unitPrice * x.qty, 0);
    const deliveryFee = zone?.fee ?? 0;
    const created = at(o.d, Math.min(o.h, 23), 12 + i);
    const flow = FLOW[o.ful];
    const history: Order["history"] = [];
    const steps = o.status === "cancelled" ? ["placed", "cancelled"] as OrderStatus[] : flow.slice(0, flow.indexOf(o.status) + 1);
    steps.forEach((s, k) => history.push({
      status: s,
      at: new Date(new Date(created).getTime() + k * 55 * 60_000).toISOString(),
      by: k === 0 ? "Customer" : s === "cancelled" ? "Shop Owner" : cashier.name,
      note: s === "cancelled" ? "Customer did not complete M-Pesa payment" : undefined,
    }));
    const order: Order = {
      id: `ord_seed_${num}`, number: `DL-${num}`, checkoutKey: `seed_${num}`, createdAt: created,
      customer: { name, phone }, items, fulfilment: o.ful, zoneId: zone?.id, zoneName: zone?.name,
      deliveryNote: zone ? "Near the main stage, blue gate" : undefined,
      deliveryFee, subtotal, total: subtotal + deliveryFee, paymentMethod: o.pay,
      paymentStatus: o.paid ? "paid" : o.pay === "cash" ? "unpaid" : o.status === "cancelled" ? "failed" : "pending",
      paymentRef: o.paid ? (o.pay === "cash" ? "CASH" : fakeMpesaRef(rand)) : undefined,
      paidAt: o.paid ? new Date(new Date(created).getTime() + 2 * 60_000).toISOString() : undefined,
      status: o.status, history, restocked: o.status === "cancelled",
    };
    orders.push(order);
    if (o.status !== "cancelled") items.forEach((it) => mv(created, it, "online_sale", "Online order", "System", order.number));
    activity.push({ id: `act_seed_o${num}`, at: created, actor: name, text: `placed order ${order.number}`, kind: "order" });
  });

  // A couple of stock deliveries
  const restock = (daysAgo: number, pid: string, vi: number, qty: number, reason: string) => {
    const p = products.find((x) => x.id === pid)!;
    const v = p.variants[vi];
    const iso = at(daysAgo, 9, 5);
    movements.push({ id: `mv_seed_in_${movements.length}`, at: iso, productId: p.id, variantId: v.id, productName: p.name, variantLabel: v.label,
      type: "stock_in", change: qty, before: v.stock - qty, after: v.stock, reason, staffName: staff[2].name });
    activity.push({ id: `act_seed_in_${movements.length}`, at: iso, actor: staff[2].name, text: `received ${qty} × ${p.name} (${v.label})`, kind: "stock" });
  };
  restock(3, "bulb-avc", 1, 40, "Supplier delivery");
  restock(2, "plug-h13a", 0, 100, "Supplier delivery");
  restock(1, "kettle-ailyons", 0, 10, "Supplier delivery");

  movements.sort((a, b) => b.at.localeCompare(a.at));
  activity.sort((a, b) => b.at.localeCompare(a.at));
  posSales.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    version: STATE_VERSION,
    seededAt: now.toISOString(),
    products,
    categories: CATEGORIES,
    orders,
    posSales,
    movements,
    staff,
    settings,
    activity,
    counters: { order: num, receipt },
  };
}

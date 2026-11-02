"use client";

import { useSyncExternalStore } from "react";
import type { AppState, CartLine, Staff } from "@/types";
import { STATE_VERSION, buildSeed } from "@/data/seed";
import { uid } from "./ids";

/**
 * One store for the whole prototype. The business data (products, stock,
 * orders, POS sales...) is a single AppState object shared by the storefront
 * and the staff app, persisted to localStorage. Cart and staff session are
 * kept under their own keys.
 */

const KEY_DATA = "duka.data";
const KEY_CART = "duka.cart";
const KEY_SESSION = "duka.session";

export interface Snapshot {
  data: AppState;
  cart: CartLine[];
  sessionStaffId: string | null;
  /** idempotency key for the current checkout attempt */
  checkoutKey: string;
  storageError: string | null;
}

let snap: Snapshot | null = null;
const listeners = new Set<() => void>();

function safeGet(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function safeSet(key: string, value: string): string | null {
  try { window.localStorage.setItem(key, value); return null; }
  catch (e) {
    return e instanceof DOMException && e.name === "QuotaExceededError"
      ? "Browser storage is full. Recent changes may not survive a refresh."
      : "Browser storage is unavailable (private mode?). Changes last until you close this tab.";
  }
}
function safeRemove(key: string) { try { window.localStorage.removeItem(key); } catch { /* ignore */ } }

function isValidData(x: unknown): x is AppState {
  if (!x || typeof x !== "object") return false;
  const d = x as Partial<AppState>;
  return d.version === STATE_VERSION
    && Array.isArray(d.products) && Array.isArray(d.orders) && Array.isArray(d.posSales)
    && Array.isArray(d.movements) && Array.isArray(d.staff) && Array.isArray(d.categories)
    && !!d.settings && Array.isArray(d.settings.zones) && !!d.counters
    && d.products.every((p) => p && typeof p.id === "string" && Array.isArray(p.variants));
}

function readData(): { data: AppState; fresh: boolean } {
  const raw = safeGet(KEY_DATA);
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isValidData(parsed)) return { data: parsed, fresh: false };
    } catch { /* fall through to reseed */ }
  }
  return { data: buildSeed(new Date()), fresh: true };
}

function readCart(): CartLine[] {
  try {
    const parsed: unknown = JSON.parse(safeGet(KEY_CART) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((l): l is CartLine =>
      !!l && typeof l.productId === "string" && typeof l.variantId === "string" && Number.isInteger(l.qty) && l.qty > 0);
  } catch { return []; }
}

function load(): Snapshot {
  const { data, fresh } = readData();
  let storageError: string | null = null;
  if (fresh) storageError = safeSet(KEY_DATA, JSON.stringify(data));
  return {
    data,
    cart: readCart(),
    sessionStaffId: safeGet(KEY_SESSION),
    checkoutKey: uid("chk"),
    storageError,
  };
}

function emit() { listeners.forEach((l) => l()); }

function persist(prev: Snapshot | null, next: Snapshot): string | null {
  let err: string | null = null;
  if (!prev || prev.data !== next.data) err = safeSet(KEY_DATA, JSON.stringify(next.data)) ?? err;
  if (!prev || prev.cart !== next.cart) err = safeSet(KEY_CART, JSON.stringify(next.cart)) ?? err;
  if (!prev || prev.sessionStaffId !== next.sessionStaffId) {
    if (next.sessionStaffId) err = safeSet(KEY_SESSION, next.sessionStaffId) ?? err;
    else safeRemove(KEY_SESSION);
  }
  return err;
}

export function getSnapshot(): Snapshot | null { return snap; }

export function ensureLoaded() {
  if (snap || typeof window === "undefined") return;
  snap = load();
  emit();
  // Keep several tabs (e.g. storefront + staff) in sync.
  window.addEventListener("storage", (e) => {
    if (!snap || (e.key !== KEY_DATA && e.key !== KEY_CART && e.key !== KEY_SESSION && e.key !== null)) return;
    const fresh = load();
    snap = { ...fresh, checkoutKey: snap.checkoutKey };
    emit();
  });
}

export function setSnapshot(update: (s: Snapshot) => Snapshot) {
  if (!snap) return;
  const prev = snap;
  const next = update(prev);
  if (next === prev) return;
  const err = persist(prev, next);
  snap = err !== prev.storageError ? { ...next, storageError: err } : next;
  emit();
}

/**
 * Runs a mutation on a deep copy of the business data and commits it
 * atomically. If the mutation throws, nothing is committed.
 */
export function commit<R>(fn: (draft: AppState) => R): R {
  if (!snap) throw new Error("Store not ready");
  const draft = structuredClone(snap.data);
  const result = fn(draft);
  setSnapshot((s) => ({ ...s, data: draft }));
  return result;
}

export function resetAll() {
  if (!snap) return;
  const data = buildSeed(new Date());
  setSnapshot((s) => ({ ...s, data, cart: [], checkoutKey: uid("chk") }));
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

const serverSnap = () => null;

/** Returns null until the browser data is loaded (render a loading state). */
export function useSnapshot(): Snapshot | null {
  return useSyncExternalStore(subscribe, getSnapshot, serverSnap);
}

export function currentStaff(s: Snapshot | null): Staff | null {
  if (!s?.sessionStaffId) return null;
  const st = s.data.staff.find((x) => x.id === s.sessionStaffId);
  return st && st.active ? st : null;
}

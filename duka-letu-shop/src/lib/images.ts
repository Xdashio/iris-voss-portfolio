"use client";

/**
 * Uploaded product photos are resized in the browser and stored in IndexedDB
 * (localStorage is too small for images). Products reference them as
 * "idb:<key>". Seed photos are plain public URLs.
 */

const DB = "duka-images";
const STORE = "images";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const r = fn(db.transaction(STORE, mode).objectStore(STORE));
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

const cache = new Map<string, string>();

export async function resolveImage(src: string): Promise<string | null> {
  if (!src.startsWith("idb:")) return src;
  if (cache.has(src)) return cache.get(src)!;
  try {
    const blob = await tx<Blob | undefined>("readonly", (s) => s.get(src.slice(4)));
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    cache.set(src, url);
    return url;
  } catch { return null; }
}

/** Resizes to max 1000px on the long edge, re-encodes as WebP (JPEG fallback). */
export async function compressImage(file: File, max = 1000, quality = 0.8): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("That file is not an image.");
  if (file.size > 15 * 1024 * 1024) throw new Error("Image is larger than 15 MB.");
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const toBlob = (type: string) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, quality));
  const blob = (await toBlob("image/webp")) ?? (await toBlob("image/jpeg"));
  if (!blob) throw new Error("Could not process this image.");
  return blob;
}

export async function storeImage(file: File): Promise<{ ref: string; bytes: number }> {
  const blob = await compressImage(file);
  const key = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  await tx("readwrite", (s) => s.put(blob, key));
  return { ref: `idb:${key}`, bytes: blob.size };
}

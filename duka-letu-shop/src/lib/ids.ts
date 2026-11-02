export function uid(prefix = ""): string {
  const rnd = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
    : Math.random().toString(36).slice(2, 14);
  return prefix ? `${prefix}_${rnd}` : rnd;
}

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
/** A fake M-Pesa style reference for the simulation, e.g. "SKL4XT9Q2M". */
export function fakeMpesaRef(rand: () => number = Math.random): string {
  let s = "S";
  for (let i = 0; i < 9; i++) s += ALPHA[Math.floor(rand() * ALPHA.length)];
  return s;
}

/** Deterministic PRNG for seeding (mulberry32). */
export function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

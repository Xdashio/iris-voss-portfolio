/** Normalises Kenyan mobile numbers to 2547XXXXXXXX / 2541XXXXXXXX, or null if invalid. */
export function normalizeKePhone(input: string): string | null {
  const d = input.replace(/[\s\-()]/g, "").replace(/^\+/, "");
  let m: RegExpMatchArray | null;
  if ((m = d.match(/^0([17]\d{8})$/))) return "254" + m[1];
  if ((m = d.match(/^254([17]\d{8})$/))) return "254" + m[1];
  if ((m = d.match(/^([17]\d{8})$/))) return "254" + m[1];
  return null;
}

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());

/** Simulated M-Pesa confirmation codes look like "SKL4XT9Q2M": 10 uppercase letters/digits. */
export const isMpesaCode = (s: string) => /^[A-Z0-9]{10}$/.test(s.trim().toUpperCase());

export const isPin = (s: string) => /^\d{4}$/.test(s);

export function intInRange(raw: string, min: number, max = Number.MAX_SAFE_INTEGER): number | null {
  if (!/^\d+$/.test(raw.trim())) return null;
  const n = parseInt(raw, 10);
  return n >= min && n <= max ? n : null;
}

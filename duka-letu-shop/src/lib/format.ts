const kes = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  currencyDisplay: "code",
  maximumFractionDigits: 0,
});
const kesCompact = new Intl.NumberFormat("en-KE", { notation: "compact", maximumFractionDigits: 1 });

/** "KES 1,250" — the only currency format used in the app. */
export const money = (n: number) => kes.format(Math.round(n)).replace(/ /g, " ");
export const moneyCompact = (n: number) => `KES ${kesCompact.format(n)}`;

const dateFmt = new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
const timeFmt = new Intl.DateTimeFormat("en-KE", { hour: "2-digit", minute: "2-digit", hour12: false });
const dayFmt = new Intl.DateTimeFormat("en-KE", { weekday: "short" });

export const fmtDate = (iso: string) => dateFmt.format(new Date(iso));
export const fmtDateTime = (iso: string) => dateTimeFmt.format(new Date(iso));
export const fmtTime = (iso: string) => timeFmt.format(new Date(iso));
export const fmtWeekday = (d: Date) => dayFmt.format(d);

export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.round((now - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

/** 254712345678 -> "0712 345 678" */
export function fmtPhone(p: string): string {
  const local = p.startsWith("254") ? "0" + p.slice(3) : p;
  return local.replace(/^(\d{4})(\d{3})(\d{3})$/, "$1 $2 $3");
}

export const plural = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;

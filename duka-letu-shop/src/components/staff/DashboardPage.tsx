"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, ClipboardList, PackageX, TriangleAlert, ScanBarcode, Globe, Boxes, Wallet } from "lucide-react";
import type { ActivityEntry } from "@/types";
import { useApp } from "@/hooks/useApp";
import { DAY, countsAsSale, salesByDay, startOfDay, topSellers } from "@/lib/calculations";
import { fmtTime, money, timeAgo } from "@/lib/format";
import { ProductImage } from "../shared/ProductImage";
import { PaymentBadge, StatusBadge } from "../shared/OrderBits";
import { Badge, Skeleton, cx } from "../shared/ui";
import { PageHeader } from "./StaffShell";
import { SalesChart } from "./SalesChart";

function Delta({ now, prev }: { now: number; prev: number }) {
  if (prev === 0 && now === 0) return <span className="text-text-3">No sales yet</span>;
  if (prev === 0) return <span className="text-text-3">vs nothing yesterday</span>;
  const pct = Math.round(((now - prev) / prev) * 100);
  return <span className={cx("font-semibold", pct >= 0 ? "text-success-600" : "text-danger-600")}>{pct >= 0 ? "▲" : "▼"} {Math.abs(pct)}% <span className="font-normal text-text-3">vs yesterday</span></span>;
}

function Tile({ label, value, foot, icon, href, tone = "plain" }: {
  label: string; value: React.ReactNode; foot?: React.ReactNode; icon: React.ReactNode; href?: string; tone?: "plain" | "hero" | "warn";
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className={cx("text-[13px] font-semibold", tone === "hero" ? "text-white/70" : "text-text-2")}>{label}</span>
        <span className={cx("[&_svg]:h-4.5 [&_svg]:w-4.5", tone === "hero" ? "text-marigold-500" : tone === "warn" ? "text-warning-600" : "text-text-3")} aria-hidden>{icon}</span>
      </div>
      <p className={cx("num mt-2 font-display text-[26px] font-bold leading-none tracking-tight", tone === "hero" && "text-white")}>{value}</p>
      {foot && <p className={cx("mt-2 text-[12px]", tone === "hero" ? "text-white/70 [&_.text-text-3]:text-white/55" : "text-text-2")}>{foot}</p>}
    </>
  );
  const cls = cx("block rounded-md p-4 transition-colors", tone === "hero" ? "bg-ink-900" : "border border-line bg-surface", href && tone !== "hero" && "hover:border-ink-700");
  return href ? <Link href={href} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}

const KIND_DOT: Record<ActivityEntry["kind"], string> = {
  order: "bg-info-600", payment: "bg-success-600", stock: "bg-warning-600", product: "bg-brand-600", pos: "bg-chart-shop", staff: "bg-clay-600", settings: "bg-text-3",
};

export function DashboardPage() {
  const snap = useApp();
  const stats = useMemo(() => {
    if (!snap) return null;
    const d = snap.data;
    const now = Date.now();
    const t0 = startOfDay(now), y0 = t0 - DAY;
    const inDay = (iso: string, start: number) => { const t = new Date(iso).getTime(); return t >= start && t < start + DAY; };
    const posOn = (s: number) => d.posSales.filter((x) => inDay(x.createdAt, s)).reduce((a, x) => a + x.total, 0);
    const onlineOn = (s: number) => d.orders.filter((o) => countsAsSale(o) && inDay(o.paidAt ?? o.createdAt, s)).reduce((a, o) => a + o.total, 0);
    const th = d.settings.lowStockThreshold;
    const variants = d.products.flatMap((p) => p.variants.map((v) => ({ p, v })));
    const low = variants.filter(({ v }) => v.stock > 0 && v.stock <= th).sort((a, b) => a.v.stock - b.v.stock);
    const out = variants.filter(({ v }) => v.stock <= 0);
    return {
      posToday: posOn(t0), posYest: posOn(y0), onlineToday: onlineOn(t0), onlineYest: onlineOn(y0),
      pending: d.orders.filter((o) => o.status === "placed"),
      inProgress: d.orders.filter((o) => ["packed", "ready_for_pickup", "out_for_delivery"].includes(o.status)).length,
      low, out, products: d.products.length, published: d.products.filter((p) => p.published).length,
      salesToday: d.posSales.filter((x) => inDay(x.createdAt, t0)).length,
      days: salesByDay(d, 7, now), top: topSellers(d, 7, now, 5), recent: d.orders.slice(0, 6), activity: d.activity.slice(0, 8),
    };
  }, [snap]);

  if (!snap || !stats) {
    return <div><Skeleton className="mb-6 h-9 w-48" /><div className="grid grid-cols-2 gap-3 lg:grid-cols-6">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-28 rounded-md" />)}</div><Skeleton className="mt-6 h-80 rounded-md" /></div>;
  }
  const s = stats;
  const today = new Date().toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div>
      <PageHeader title="Dashboard" sub={<>{today} · Figures update with every order and till sale.</>}
        actions={<Link href="/staff/pos" className="inline-flex h-10 items-center gap-2 rounded-sm bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"><ScanBarcode className="h-4 w-4" aria-hidden /> Open till</Link>} />

      <section aria-label="Key figures" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <div className="col-span-2 md:col-span-1 xl:col-span-2">
          <Tile tone="hero" label="Sales today" icon={<Wallet />} value={money(s.posToday + s.onlineToday)}
            foot={<Delta now={s.posToday + s.onlineToday} prev={s.posYest + s.onlineYest} />} />
        </div>
        <Tile label="Shop (POS) today" icon={<ScanBarcode />} value={money(s.posToday)} foot={`${s.salesToday} till ${s.salesToday === 1 ? "sale" : "sales"}`} />
        <Tile label="Online today" icon={<Globe />} value={money(s.onlineToday)} foot="Paid orders" />
        <Tile label="New online orders" icon={<ClipboardList />} value={s.pending.length} href="/staff/orders" tone={s.pending.length ? "warn" : "plain"}
          foot={<>{s.inProgress} more in progress</>} />
        <Tile label="Low / out of stock" icon={<TriangleAlert />} value={<>{s.low.length}<span className="text-text-3"> / {s.out.length}</span></>} href="/staff/inventory" tone={s.low.length + s.out.length ? "warn" : "plain"}
          foot={`of ${s.products} products (${s.published} live)`} />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-md border border-line bg-surface p-5" aria-labelledby="chart-t">
          <h2 id="chart-t" className="mb-1 text-lg">Sales, last 7 days</h2>
          <p className="mb-4 text-[13px] text-text-3">Shop till and paid online orders, KES</p>
          <SalesChart days={s.days} />
        </section>

        <section className="rounded-md border border-line bg-surface" aria-labelledby="top-t">
          <h2 id="top-t" className="border-b border-line px-5 py-4 text-lg">Top sellers · 7 days</h2>
          {s.top.length === 0 ? <p className="px-5 py-8 text-center text-sm text-text-3">No sales in the last 7 days.</p> : (
            <ol className="divide-y divide-line">
              {s.top.map((t, i) => (
                <li key={t.productId} className="flex items-center gap-3 px-5 py-3">
                  <span className="num w-4 text-sm font-bold text-text-3">{i + 1}</span>
                  <ProductImage src={t.image} alt="" className="h-10 w-10 shrink-0 rounded-sm" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{t.name}</p><p className="num text-[12px] text-text-3">{t.qty} sold</p></div>
                  <span className="num text-sm font-semibold">{money(t.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-md border border-line bg-surface" aria-labelledby="ord-t">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 id="ord-t" className="text-lg">Recent online orders</h2>
            <Link href="/staff/orders" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">All orders <ArrowRight className="h-4 w-4" aria-hidden /></Link>
          </div>
          <ul className="divide-y divide-line">
            {s.recent.map((o) => (
              <li key={o.id}>
                <Link href={`/staff/orders?open=${o.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 hover:bg-canvas">
                  <span className="num w-20 text-sm font-bold">{o.number}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{o.customer.name} <span className="text-text-3">· {o.items.reduce((a, i) => a + i.qty, 0)} items · {o.fulfilment === "pickup" ? "Pickup" : "Delivery"}</span></span>
                  <span className="flex items-center gap-2"><StatusBadge status={o.status} /><PaymentBadge status={o.paymentStatus} /></span>
                  <span className="num w-24 text-right text-sm font-semibold">{money(o.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-6">
          <section className="rounded-md border border-line bg-surface" aria-labelledby="low-t">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 id="low-t" className="text-lg">Stock alerts</h2>
              <Link href="/staff/inventory?level=attention" className="text-sm font-semibold text-brand-600 hover:text-brand-700">Inventory</Link>
            </div>
            {s.out.length + s.low.length === 0 ? <p className="px-5 py-6 text-sm text-text-3">All products are well stocked.</p> : (
              <ul className="max-h-64 divide-y divide-line overflow-y-auto">
                {[...s.out, ...s.low].slice(0, 8).map(({ p, v }) => (
                  <li key={v.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                    {v.stock <= 0 ? <PackageX className="h-4 w-4 shrink-0 text-danger-600" aria-hidden /> : <TriangleAlert className="h-4 w-4 shrink-0 text-warning-600" aria-hidden />}
                    <span className="min-w-0 flex-1 truncate">{p.name} <span className="text-text-3">· {v.label}</span></span>
                    <Badge tone={v.stock <= 0 ? "danger" : "warning"}>{v.stock <= 0 ? "Out" : `${v.stock} left`}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-md border border-line bg-surface" aria-labelledby="act-t">
            <h2 id="act-t" className="border-b border-line px-5 py-4 text-lg">Recent activity</h2>
            <ul className="space-y-3 px-5 py-4">
              {s.activity.map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <span className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", KIND_DOT[a.kind])} aria-hidden />
                  <p className="min-w-0 flex-1"><b>{a.actor}</b> {a.text}<span className="num block text-[12px] text-text-3" title={fmtTime(a.at)}>{timeAgo(a.at)}</span></p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
      <p className="mt-6 flex items-center gap-2 text-[12px] text-text-3"><Boxes className="h-3.5 w-3.5" aria-hidden /> Catalogue prices and stock are demonstration values, not the shop’s real figures.</p>
    </div>
  );
}

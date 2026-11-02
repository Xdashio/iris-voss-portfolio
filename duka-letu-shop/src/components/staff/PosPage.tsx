"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, ScanBarcode, Trash2, Banknote, Smartphone, ShoppingCart, Printer, Copy, Share2, Plus, CircleCheck } from "lucide-react";
import type { CartLine, PosPayment, PosSale, Product } from "@/types";
import { useStaff } from "@/hooks/useApp";
import { completeSale } from "@/lib/actions";
import { findVariant } from "@/lib/calculations";
import { fmtDateTime, money } from "@/lib/format";
import { uid } from "@/lib/ids";
import { useToast } from "../shared/toast";
import { ProductImage } from "../shared/ProductImage";
import { Price } from "../shared/bits";
import { Button, Dialog, Drawer, EmptyState, Field, Input, QtyStepper, Segmented, Skeleton, cx } from "../shared/ui";

function receiptText(s: PosSale, shop: string) {
  return [
    shop.toUpperCase(), `Receipt ${s.receiptNo}`, fmtDateTime(s.createdAt), `Cashier: ${s.cashierName}`, "",
    ...s.items.map((i) => `${i.qty} x ${i.name} (${i.variantLabel})  ${money(i.qty * i.unitPrice)}`), "",
    `TOTAL ${money(s.total)}`,
    s.payment === "cash" ? `Cash ${money(s.tendered ?? 0)} · Change ${money(s.change ?? 0)}` : `M-Pesa ref ${s.mpesaRef}`,
    "", "Thank you for shopping with us!",
  ].join("\n");
}

function Receipt({ sale, shop, phone }: { sale: PosSale; shop: string; phone: string }) {
  return (
    <div className="print-area mx-auto max-w-[320px] bg-surface font-mono text-[12px] leading-relaxed text-text">
      <div className="text-center">
        <p className="font-sans text-[15px] font-extrabold">{shop}</p>
        <p>{phone}</p>
        <p className="mt-1">Receipt <b>{sale.receiptNo}</b></p>
        <p>{fmtDateTime(sale.createdAt)} · {sale.cashierName}</p>
      </div>
      <div className="my-2 border-t border-dashed border-text-3" />
      <table className="w-full">
        <tbody>
          {sale.items.map((i) => (
            <tr key={i.variantId} className="align-top">
              <td className="py-0.5 pr-2">{i.qty} × {i.name}<span className="block text-text-3">{i.variantLabel} @ {money(i.unitPrice)}</span></td>
              <td className="py-0.5 text-right whitespace-nowrap">{money(i.qty * i.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="my-2 border-t border-dashed border-text-3" />
      <p className="flex justify-between text-[14px] font-bold"><span>TOTAL</span><span>{money(sale.total)}</span></p>
      {sale.payment === "cash" ? (
        <><p className="flex justify-between"><span>Cash</span><span>{money(sale.tendered ?? 0)}</span></p><p className="flex justify-between"><span>Change</span><span>{money(sale.change ?? 0)}</span></p></>
      ) : <p className="flex justify-between"><span>M-Pesa</span><span>{sale.mpesaRef}</span></p>}
      <div className="my-2 border-t border-dashed border-text-3" />
      <p className="text-center">Thank you for shopping with us!</p>
    </div>
  );
}

export function PosPage() {
  const { snap, staff } = useStaff();
  const { toast, attempt } = useToast();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [lines, setLines] = useState<CartLine[]>([]);
  const [pay, setPay] = useState<PosPayment>("cash");
  const [tendered, setTendered] = useState("");
  const [code, setCode] = useState("");
  const [pick, setPick] = useState<Product | null>(null);
  const [receipt, setReceipt] = useState<PosSale | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [key, setKey] = useState(() => uid("pos"));
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { searchRef.current?.focus(); }, []);

  const products = useMemo(() => {
    if (!snap) return [];
    const t = q.trim().toLowerCase();
    return snap.data.products.filter((p) => p.variants.some((v) => v.price > 0) && (!cat || p.categoryId === cat)
      && (!t || `${p.name} ${p.brand} ${p.sku} ${p.variants.map((v) => `${v.sku} ${v.label}`).join(" ")}`.toLowerCase().includes(t)));
  }, [snap, q, cat]);

  if (!snap) return <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]"><Skeleton className="h-[70vh] rounded-md" /><Skeleton className="h-[70vh] rounded-md" /></div>;

  const rows = lines.map((l) => ({ l, hit: findVariant(snap.data, l.productId, l.variantId) })).filter((r) => r.hit) as { l: CartLine; hit: NonNullable<ReturnType<typeof findVariant>> }[];
  const total = rows.reduce((s, r) => s + r.hit.variant.price * r.l.qty, 0);
  const count = rows.reduce((s, r) => s + r.l.qty, 0);
  const cash = /^\d+$/.test(tendered) ? parseInt(tendered, 10) : 0;
  const change = cash - total;
  const ready = rows.length > 0 && (pay === "cash" ? cash >= total : /^[A-Z0-9]{10}$/.test(code));

  const add = (productId: string, variantId: string) => {
    const hit = findVariant(snap.data, productId, variantId);
    if (!hit) return;
    const have = lines.find((l) => l.variantId === variantId)?.qty ?? 0;
    if (have + 1 > hit.variant.stock) { toast({ kind: "error", title: hit.variant.stock === 0 ? `${hit.product.name} (${hit.variant.label}) is out of stock` : `Only ${hit.variant.stock} in stock` }); return; }
    setLines((ls) => have ? ls.map((l) => l.variantId === variantId ? { ...l, qty: l.qty + 1 } : l) : [...ls, { productId, variantId, qty: 1 }]);
  };
  const choose = (p: Product) => {
    const vs = p.variants.filter((v) => v.price > 0);
    if (vs.length === 1) add(p.id, vs[0].id); else setPick(p);
  };
  const onSearchEnter = () => {
    const t = q.trim().toUpperCase();
    if (!t) return;
    for (const p of snap.data.products) {
      const v = p.variants.find((x) => x.sku.toUpperCase() === t && x.price > 0);
      if (v) { add(p.id, v.id); setQ(""); return; }
    }
    if (products.length === 1) { choose(products[0]); setQ(""); }
  };
  const finish = () => {
    const sale = attempt(() => completeSale({ key, lines, payment: pay, tendered: cash, mpesaRef: code }));
    if (!sale) return;
    setReceipt(sale); setCartOpen(false);
  };
  const newSale = () => { setReceipt(null); setLines([]); setTendered(""); setCode(""); setPay("cash"); setKey(uid("pos")); setTimeout(() => searchRef.current?.focus(), 50); };
  const settings = snap.data.settings;

  const cartPanel = (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <EmptyState icon={<ShoppingCart />} title="No items yet" body="Search or scan a SKU, or tap a product to add it." className="py-10" />
        ) : (
          <ul className="divide-y divide-line">
            {rows.map(({ l, hit: { product: p, variant: v } }) => (
              <li key={v.id} className="flex gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold">{p.name}</p>
                  <p className="num text-[12px] text-text-3">{v.label} · {money(v.price)} · {v.stock} in stock</p>
                  <div className="mt-2 flex items-center gap-2">
                    <QtyStepper size="sm" value={l.qty} max={v.stock} onChange={(n) => setLines((ls) => ls.map((x) => x.variantId === v.id ? { ...x, qty: n } : x))} label={`Quantity of ${p.name}`} />
                    <Button variant="ghost" size="icon-sm" aria-label={`Remove ${p.name}`} onClick={() => setLines((ls) => ls.filter((x) => x.variantId !== v.id))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <span className="num text-sm font-bold">{money(v.price * l.qty)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="space-y-3 border-t border-line bg-canvas/70 p-4">
        <div className="flex items-baseline justify-between"><span className="font-semibold">Total <span className="num font-normal text-text-3">· {count === 1 ? "1 item" : `${count} items`}</span></span><Price value={total} size="xl" /></div>
        <Segmented label="Payment method" value={pay} onChange={setPay} options={[{ value: "cash", label: <><Banknote className="h-4 w-4" aria-hidden /> Cash</> }, { value: "mpesa", label: <><Smartphone className="h-4 w-4" aria-hidden /> M-Pesa</> }]} />
        {pay === "cash" ? (
          <div>
            <Field label="Cash received (KES)" htmlFor="pos-cash">
              <Input id="pos-cash" inputMode="numeric" value={tendered} onChange={(e) => setTendered(e.target.value.replace(/\D/g, ""))} className="num h-11 text-lg font-semibold" />
            </Field>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[total, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500, Math.ceil(total / 1000) * 1000].filter((v, i, a) => v > 0 && a.indexOf(v) === i).map((v) => (
                <button key={v} type="button" onClick={() => setTendered(String(v))} className="num rounded-xs border border-line-strong bg-surface px-2 py-1 text-[12px] font-semibold hover:border-ink-700">{v === total ? "Exact" : money(v)}</button>
              ))}
            </div>
            <p className={cx("num mt-2 flex justify-between rounded-sm px-3 py-2 text-sm font-semibold", tendered && change < 0 ? "bg-danger-100 text-danger-600" : "bg-surface")} aria-live="polite">
              <span>{tendered && change < 0 ? "Still owed" : "Change"}</span><span className="font-display text-base">{money(Math.abs(tendered ? change : 0))}</span>
            </p>
          </div>
        ) : (
          <Field label="M-Pesa confirmation code" htmlFor="pos-code" hint="From the customer’s M-Pesa SMS (simulated in demo).">
            <Input id="pos-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))} placeholder="SKL4XT9Q2M" className="num h-11 uppercase tracking-wider" aria-describedby="pos-code-hint" />
          </Field>
        )}
        <Button size="lg" variant="accent" block disabled={!ready} onClick={finish}>Complete sale · {money(total)}</Button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div><h1 className="text-[24px] sm:text-[28px]">Point of sale</h1><p className="text-sm text-text-2">Cashier: {staff?.name} · Sales come off the same stock as the website.</p></div>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section aria-label="Products" className="min-w-0">
          <form className="relative" onSubmit={(e) => { e.preventDefault(); onSearchEnter(); }}>
            <label htmlFor="pos-q" className="sr-only">Search product or scan SKU</label>
            <ScanBarcode className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-text-3" aria-hidden />
            <Input ref={searchRef} id="pos-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search or scan SKU (e.g. DL-001-2), then Enter" className="h-12 pl-11 text-base" autoComplete="off" />
          </form>
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
            {[{ id: "", name: "All" }, ...snap.data.categories].map((c) => (
              <button key={c.id} onClick={() => setCat(c.id)} aria-pressed={cat === c.id}
                className={cx("shrink-0 rounded-xs border px-2.5 py-1 text-[13px] font-semibold", cat === c.id ? "border-ink-800 bg-ink-800 text-white" : "border-line-strong bg-surface hover:border-ink-700")}>{c.name}</button>
            ))}
          </div>
          {products.length === 0 ? <EmptyState icon={<Search />} title="No match" body="Check the spelling or SKU." /> : (
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => {
                const stock = p.variants.reduce((s, v) => s + v.stock, 0);
                const prices = p.variants.filter((v) => v.price > 0).map((v) => v.price);
                return (
                  <li key={p.id}>
                    <button onClick={() => choose(p)} disabled={stock <= 0} className="flex h-full w-full flex-col overflow-hidden rounded-md border border-line bg-surface text-left hover:border-brand-600 disabled:opacity-50 disabled:hover:border-line">
                      <ProductImage src={p.images[0]} alt="" className="aspect-[4/3] w-full" />
                      <span className="flex flex-1 flex-col p-2.5">
                        <span className="line-clamp-2 text-[13px] font-semibold leading-snug">{p.name}</span>
                        <span className="mt-auto flex items-baseline justify-between gap-1 pt-1.5">
                          <span className="num text-sm font-bold">{Math.min(...prices) !== Math.max(...prices) ? "from " : ""}{money(Math.min(...prices))}</span>
                          <span className={cx("num text-[11px]", stock <= 0 ? "font-semibold text-danger-600" : "text-text-3")}>{stock <= 0 ? "Out" : `${stock} left`}</span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="sticky top-20 hidden h-[calc(100dvh-7rem)] overflow-hidden rounded-md border border-line bg-surface lg:block" aria-label="Current sale">
          <h2 className="border-b border-line px-4 py-3 text-lg">Current sale</h2>
          <div className="h-[calc(100%-53px)]">{cartPanel}</div>
        </aside>
      </div>

      {/* Mobile sale bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface p-3 lg:hidden">
        <Button size="lg" variant={count ? "accent" : "outline"} block onClick={() => setCartOpen(true)}>
          <ShoppingCart className="h-5 w-5" aria-hidden /> Current sale · {count === 1 ? "1 item" : `${count} items`} · {money(total)}
        </Button>
      </div>
      <div className="h-20 lg:hidden" aria-hidden />
      <Drawer open={cartOpen} onClose={() => setCartOpen(false)} title="Current sale">{cartPanel}</Drawer>

      {pick && (
        <Dialog open onClose={() => setPick(null)} title={pick.name} description="Choose a variant" size="sm">
          <ul className="grid gap-2">
            {pick.variants.filter((v) => v.price > 0).map((v) => (
              <li key={v.id}>
                <button disabled={v.stock <= 0} onClick={() => { add(pick.id, v.id); setPick(null); }}
                  className="flex w-full items-center justify-between rounded-sm border border-line-strong px-3 py-2.5 text-left hover:border-brand-600 disabled:opacity-50">
                  <span><b className="text-sm">{v.label}</b><span className="num block text-[12px] text-text-3">{v.sku} · {v.stock} in stock</span></span>
                  <span className="num flex items-center gap-2 font-bold">{money(v.price)} <Plus className="h-4 w-4 text-brand-600" aria-hidden /></span>
                </button>
              </li>
            ))}
          </ul>
        </Dialog>
      )}

      {receipt && (
        <Dialog open onClose={newSale} title={<span className="flex items-center gap-2"><CircleCheck className="h-5 w-5 text-success-600" aria-hidden /> Sale complete</span>} size="sm"
          footer={<>
            <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" aria-hidden /> Print</Button>
            <Button variant="outline" onClick={async () => {
              const text = receiptText(receipt, settings.shopName);
              try {
                if (navigator.share) await navigator.share({ title: `Receipt ${receipt.receiptNo}`, text });
                else { await navigator.clipboard.writeText(text); toast({ kind: "success", title: "Receipt copied" }); }
              } catch { /* user cancelled share */ }
            }}>{typeof navigator !== "undefined" && "share" in navigator ? <Share2 className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />} Send</Button>
            <Button onClick={newSale} data-autofocus>New sale</Button>
          </>}>
          {receipt.payment === "cash" && (receipt.change ?? 0) > 0 && (
            <p className="mb-4 rounded-sm bg-success-100 px-4 py-3 text-center"><span className="block text-[12px] font-semibold uppercase tracking-wider text-success-600">Give change</span><span className="num font-display text-[28px] font-bold">{money(receipt.change ?? 0)}</span></p>
          )}
          <div className="rounded-sm border border-line p-4"><Receipt sale={receipt} shop={settings.shopName} phone={settings.phone} /></div>
        </Dialog>
      )}
    </div>
  );
}

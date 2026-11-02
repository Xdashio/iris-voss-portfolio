"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Search, Warehouse, History, ArrowDownToLine, ArrowUpFromLine, ClipboardCheck, PackageCheck, TriangleAlert, PackageX, Layers } from "lucide-react";
import type { MovementType, Product, ProductVariant } from "@/types";
import { useStaff } from "@/hooks/useApp";
import { adjustStock, type AdjustKind } from "@/lib/actions";
import { stockLevel } from "@/lib/calculations";
import { fmtDateTime, timeAgo } from "@/lib/format";
import { can } from "@/lib/permissions";
import { useToast } from "../shared/toast";
import { ProductImage } from "../shared/ProductImage";
import { StockBadge } from "../shared/bits";
import { Badge, Button, Dialog, EmptyState, Field, Input, Segmented, Select, Skeleton, cx } from "../shared/ui";
import { PageHeader } from "./StaffShell";

const MOVE_LABEL: Record<MovementType, string> = {
  stock_in: "Stock in", stock_out: "Stock out", adjustment: "Count adjustment", online_sale: "Online order",
  pos_sale: "Shop sale", restock_cancel: "Cancelled order", opening: "Opening stock",
};
const REASONS: Record<AdjustKind, string[]> = {
  stock_in: ["Supplier delivery", "Customer return", "Transfer from store room"],
  stock_out: ["Damaged", "Expired / faulty", "Used in shop", "Given as sample"],
  adjustment: ["Stock count", "Correction of earlier mistake"],
};

interface Row { p: Product; v: ProductVariant }

function AdjustDialog({ initial, onClose }: { initial: Row | null; onClose: () => void }) {
  const { snap } = useStaff();
  const { attempt } = useToast();
  const [productId, setProductId] = useState(initial?.p.id ?? "");
  const [variantId, setVariantId] = useState(initial?.v.id ?? "");
  const [kind, setKind] = useState<AdjustKind>("stock_in");
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState(REASONS.stock_in[0]);
  const [other, setOther] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const products = snap?.data.products ?? [];
  const p = products.find((x) => x.id === productId);
  const v = p?.variants.find((x) => x.id === variantId);
  useEffect(() => { setReason(REASONS[kind][0]); }, [kind]);
  useEffect(() => { if (p && !p.variants.some((x) => x.id === variantId)) setVariantId(p.variants[0]?.id ?? ""); }, [p, variantId]);

  const n = /^\d+$/.test(qty) ? parseInt(qty, 10) : null;
  const after = v && n !== null ? (kind === "stock_in" ? v.stock + n : kind === "stock_out" ? v.stock - n : n) : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!p || !v) return setErr("Choose a product and variant.");
    if (n === null) return setErr("Enter a whole number.");
    if (after !== null && after < 0) return setErr(`Only ${v.stock} in stock.`);
    const why = reason === "Other" ? other.trim() : reason;
    if (!why) return setErr("Give a reason.");
    const r = attempt(() => adjustStock(p.id, v.id, kind, n, why), (x) => `${p.name} (${v.label}): ${x.before} → ${x.after}`);
    if (r) onClose();
  };

  return (
    <Dialog open onClose={onClose} title="Record stock movement" description="Every change is logged with your name and reason."
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" form="adj">Save</Button></>}>
      <form id="adj" onSubmit={submit} noValidate className="space-y-4">
        <Segmented label="Movement type" value={kind} onChange={setKind} options={[
          { value: "stock_in", label: "Stock in" }, { value: "stock_out", label: "Stock out" }, { value: "adjustment", label: "Count" },
        ]} />
        <Field label="Product" htmlFor="a-prod">
          <Select id="a-prod" value={productId} onChange={(e) => { setProductId(e.target.value); setErr(null); }}>
            <option value="">Choose a product…</option>
            {[...products].sort((a, b) => a.name.localeCompare(b.name)).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </Select>
        </Field>
        {p && p.variants.length > 1 && (
          <Field label="Variant" htmlFor="a-var">
            <Select id="a-var" value={variantId} onChange={(e) => setVariantId(e.target.value)}>
              {p.variants.map((x) => <option key={x.id} value={x.id}>{x.label} · {x.stock} in stock</option>)}
            </Select>
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label={kind === "adjustment" ? "Counted quantity" : "Quantity"} htmlFor="a-qty">
            <Input id="a-qty" inputMode="numeric" value={qty} onChange={(e) => { setQty(e.target.value.replace(/\D/g, "")); setErr(null); }} className="num" data-autofocus={initial ? true : undefined} />
          </Field>
          <div className="flex flex-col justify-end rounded-sm bg-canvas px-3 py-2 text-sm" aria-live="polite">
            <span className="text-[12px] text-text-3">Stock</span>
            <span className="num font-display text-lg font-bold">{v ? <>{v.stock} <span className="text-text-3">→</span> <span className={cx(after !== null && after < 0 && "text-danger-600")}>{after ?? "?"}</span></> : "—"}</span>
          </div>
        </div>
        <Field label="Reason" htmlFor="a-reason">
          <Select id="a-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
            {[...REASONS[kind], "Other"].map((r) => <option key={r}>{r}</option>)}
          </Select>
        </Field>
        {reason === "Other" && <Field label="Describe the reason" htmlFor="a-other"><Input id="a-other" value={other} onChange={(e) => setOther(e.target.value)} /></Field>}
        {err && <p role="alert" className="text-sm font-medium text-danger-600">{err}</p>}
      </form>
    </Dialog>
  );
}

function InventoryInner() {
  const { snap, staff } = useStaff();
  const sp = useSearchParams();
  const [tab, setTab] = useState<"levels" | "log">("levels");
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<"" | "attention" | "low" | "out">((sp.get("level") as "attention") ?? "");
  const [moveType, setMoveType] = useState<"" | MovementType>("");
  const [adjust, setAdjust] = useState<{ row: Row | null } | null>(null);
  const canAdjust = can(staff, "inventory.adjust");
  const th = snap?.data.settings.lowStockThreshold ?? 5;

  const rows = useMemo<Row[]>(() => (snap?.data.products ?? []).flatMap((p) => p.variants.map((v) => ({ p, v }))), [snap]);
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows.filter(({ p, v }) => {
      const lv = stockLevel(v.stock, th);
      if (level === "attention" && lv === "in") return false;
      if ((level === "low" || level === "out") && lv !== level) return false;
      return !t || `${p.name} ${p.brand} ${v.label} ${v.sku}`.toLowerCase().includes(t);
    }).sort((a, b) => a.v.stock - b.v.stock || a.p.name.localeCompare(b.p.name));
  }, [rows, q, level, th]);
  const moves = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (snap?.data.movements ?? []).filter((m) => (!moveType || m.type === moveType) && (!t || `${m.productName} ${m.variantLabel} ${m.reason} ${m.staffName} ${m.ref ?? ""}`.toLowerCase().includes(t))).slice(0, 200);
  }, [snap, q, moveType]);

  if (!snap) return <><Skeleton className="mb-6 h-9 w-40" /><div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-md" />)}</div><Skeleton className="h-96 rounded-md" /></>;

  const low = rows.filter((r) => stockLevel(r.v.stock, th) === "low").length;
  const out = rows.filter((r) => r.v.stock <= 0).length;
  const units = rows.reduce((s, r) => s + r.v.stock, 0);
  const tiles = [
    { label: "Tracked variants", value: rows.length, icon: <Layers />, onClick: () => setLevel("") },
    { label: "Units in stock", value: units.toLocaleString("en-KE"), icon: <PackageCheck />, onClick: () => setLevel("") },
    { label: `Low stock (≤ ${th})`, value: low, icon: <TriangleAlert />, tone: "warn", onClick: () => { setTab("levels"); setLevel("low"); } },
    { label: "Out of stock", value: out, icon: <PackageX />, tone: "danger", onClick: () => { setTab("levels"); setLevel("out"); } },
  ];

  return (
    <div>
      <PageHeader title="Inventory" sub="One stock count for the website and the till. Sales and adjustments update it instantly."
        actions={canAdjust && <Button onClick={() => setAdjust({ row: null })}><ArrowDownToLine className="h-4 w-4" aria-hidden /> Record movement</Button>} />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <button key={t.label} onClick={t.onClick} className="rounded-md border border-line bg-surface p-4 text-left hover:border-ink-700">
            <span className="flex items-center justify-between text-[13px] font-semibold text-text-2">{t.label}
              <span className={cx("[&_svg]:h-4.5 [&_svg]:w-4.5", t.tone === "warn" ? "text-warning-600" : t.tone === "danger" ? "text-danger-600" : "text-text-3")} aria-hidden>{t.icon}</span></span>
            <span className="num mt-2 block font-display text-[26px] font-bold leading-none">{t.value}</span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <Segmented label="Inventory view" value={tab} onChange={setTab} options={[{ value: "levels", label: "Stock levels" }, { value: "log", label: "Movement log" }]} />
        <div className="flex flex-1 flex-wrap gap-2 lg:justify-end">
          <div className="relative min-w-0 flex-1 lg:max-w-72">
            <label htmlFor="inv-q" className="sr-only">Search</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" aria-hidden />
            <Input id="inv-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tab === "levels" ? "Product, variant or SKU" : "Product, reason, staff, ref"} className="pl-9" />
          </div>
          {tab === "levels" ? (
            <><label htmlFor="inv-l" className="sr-only">Stock level</label>
              <Select id="inv-l" value={level} onChange={(e) => setLevel(e.target.value as typeof level)} className="w-44">
                <option value="">All levels</option><option value="attention">Needs attention</option><option value="low">Low stock</option><option value="out">Out of stock</option>
              </Select></>
          ) : (
            <><label htmlFor="inv-t" className="sr-only">Movement type</label>
              <Select id="inv-t" value={moveType} onChange={(e) => setMoveType(e.target.value as typeof moveType)} className="w-44">
                <option value="">All movements</option>{Object.entries(MOVE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select></>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-surface">
        {tab === "levels" ? (filtered.length === 0 ? <EmptyState icon={<Warehouse />} title="Nothing here" body={level ? "No variants at this stock level. Nice." : "No products match your search."} /> : (
          <>
          <ul className="divide-y divide-line md:hidden">
            {filtered.map(({ p, v }) => (
              <li key={v.id} className="flex items-center gap-3 px-4 py-3">
                <ProductImage src={p.images[0]} alt="" className="h-11 w-11 shrink-0 rounded-sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="num truncate text-[12px] text-text-3">{v.label} · {v.sku}</p>
                  <div className="mt-1"><StockBadge stock={v.stock} threshold={th} /></div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="num font-display text-lg font-bold leading-none">{v.stock}</span>
                  {canAdjust && <Button size="sm" variant="outline" onClick={() => setAdjust({ row: { p, v } })} aria-label={`Adjust stock for ${p.name} ${v.label}`}>Adjust</Button>}
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-line bg-canvas text-left text-[12px] uppercase tracking-wider text-text-3">
                <tr><th className="px-4 py-2.5 font-semibold">Product</th><th className="px-4 py-2.5 font-semibold">SKU</th><th className="px-4 py-2.5 text-right font-semibold">Qty</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th><th className="px-4 py-2.5 font-semibold">Last updated</th>{canAdjust && <th className="px-4 py-2.5"><span className="sr-only">Actions</span></th>}</tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map(({ p, v }) => (
                  <tr key={v.id} className="hover:bg-canvas">
                    <td className="px-4 py-2.5"><div className="flex items-center gap-3"><ProductImage src={p.images[0]} alt="" className="h-9 w-9 shrink-0 rounded-sm" />
                      <div className="min-w-0"><p className="max-w-[300px] truncate font-semibold">{p.name}</p><p className="text-[12px] text-text-3">{v.label}{!p.published && " · hidden"}</p></div></div></td>
                    <td className="num px-4 py-2.5 text-text-2">{v.sku}</td>
                    <td className="num px-4 py-2.5 text-right font-display text-base font-bold">{v.stock}</td>
                    <td className="px-4 py-2.5"><StockBadge stock={v.stock} threshold={th} /></td>
                    <td className="px-4 py-2.5 text-text-2" title={fmtDateTime(v.updatedAt)}>{timeAgo(v.updatedAt)}</td>
                    {canAdjust && <td className="px-4 py-2.5 text-right"><Button size="sm" variant="outline" onClick={() => setAdjust({ row: { p, v } })} aria-label={`Adjust stock for ${p.name} ${v.label}`}>Adjust</Button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )) : (moves.length === 0 ? <EmptyState icon={<History />} title="No movements found" /> : (
          <>
          <ul className="divide-y divide-line md:hidden">
            {moves.map((m) => (
              <li key={m.id} className="px-4 py-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0"><b className="block truncate">{m.productName}</b><span className="text-[12px] text-text-3">{m.variantLabel} · {MOVE_LABEL[m.type]}</span></p>
                  <span className={cx("num shrink-0 text-right font-bold", m.change > 0 ? "text-success-600" : "text-text")}>{m.change > 0 ? `+${m.change}` : m.change}<span className="block text-[12px] font-normal text-text-3">{m.before} → {m.after}</span></span>
                </div>
                <p className="mt-1 text-[12px] text-text-2">{m.reason}{m.ref ? ` · ${m.ref}` : ""} · {m.staffName} · <span className="num">{fmtDateTime(m.at)}</span></p>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-line bg-canvas text-left text-[12px] uppercase tracking-wider text-text-3">
                <tr><th className="px-4 py-2.5 font-semibold">When</th><th className="px-4 py-2.5 font-semibold">Product</th><th className="px-4 py-2.5 font-semibold">Type</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Change</th><th className="px-4 py-2.5 text-right font-semibold">Stock</th><th className="px-4 py-2.5 font-semibold">Reason</th><th className="px-4 py-2.5 font-semibold">By</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {moves.map((m) => (
                  <tr key={m.id}>
                    <td className="num whitespace-nowrap px-4 py-2.5 text-text-2">{fmtDateTime(m.at)}</td>
                    <td className="px-4 py-2.5"><p className="max-w-[240px] truncate font-medium">{m.productName}</p><p className="text-[12px] text-text-3">{m.variantLabel}</p></td>
                    <td className="px-4 py-2.5"><Badge tone={m.change > 0 ? "success" : m.type === "adjustment" ? "info" : "neutral"}>{m.change > 0 ? <ArrowDownToLine className="h-3 w-3" aria-hidden /> : m.type === "adjustment" ? <ClipboardCheck className="h-3 w-3" aria-hidden /> : <ArrowUpFromLine className="h-3 w-3" aria-hidden />}{MOVE_LABEL[m.type]}</Badge></td>
                    <td className={cx("num px-4 py-2.5 text-right font-bold", m.change > 0 ? "text-success-600" : "text-text")}>{m.change > 0 ? `+${m.change}` : m.change}</td>
                    <td className="num whitespace-nowrap px-4 py-2.5 text-right text-text-2">{m.before} → <b className="text-text">{m.after}</b></td>
                    <td className="px-4 py-2.5 text-text-2">{m.reason}{m.ref && <span className="num block text-[12px] text-text-3">{m.ref}</span>}</td>
                    <td className="px-4 py-2.5">{m.staffName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        ))}
      </div>
      {adjust && <AdjustDialog initial={adjust.row} onClose={() => setAdjust(null)} />}
    </div>
  );
}

export function InventoryPage() { return <Suspense><InventoryInner /></Suspense>; }

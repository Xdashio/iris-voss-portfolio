"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { SlidersHorizontal, X, SearchX, ChevronRight } from "lucide-react";
import type { Category, Product } from "@/types";
import { useApp } from "@/hooks/useApp";
import { isPublic, priceRange, publicVariants } from "@/lib/calculations";
import { money } from "@/lib/format";
import { ProductGrid, ProductGridSkeleton } from "./ProductCard";
import { Button, Checkbox, Drawer, EmptyState, Input, Select, cx } from "../shared/ui";

type Sort = "featured" | "price-asc" | "price-desc" | "newest";
const SORTS: { value: Sort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
];
const BUDGETS: { label: string; min?: number; max?: number }[] = [
  { label: "Under KES 500", max: 500 },
  { label: "KES 500 – 2,000", min: 500, max: 2000 },
  { label: "KES 2,000 – 5,000", min: 2000, max: 5000 },
  { label: "Over KES 5,000", min: 5000 },
];

interface Filters { q: string; cats: string[]; brands: string[]; min?: number; max?: number; inStock: boolean; sort: Sort }

function readFilters(sp: URLSearchParams): Filters {
  const num = (k: string) => { const v = sp.get(k); return v && /^\d+$/.test(v) ? parseInt(v, 10) : undefined; };
  const list = (k: string) => (sp.get(k) ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const sort = sp.get("sort") as Sort;
  return { q: sp.get("q") ?? "", cats: list("cat"), brands: list("brand"), min: num("min"), max: num("max"), inStock: sp.get("stock") === "1",
    sort: SORTS.some((s) => s.value === sort) ? sort : "featured" };
}

function matches(p: Product, cat: Category | undefined, q: string): boolean {
  if (!q) return true;
  const hay = [p.name, p.brand, p.description, cat?.name ?? "", p.sku, ...p.variants.map((v) => v.label)].join(" ").toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((t) => hay.includes(t.replace(/s$/, "")));
}

export function ProductListing({ category }: { category?: Category }) {
  const snap = useApp();
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const f = readFilters(new URLSearchParams(sp.toString()));

  const update = (patch: Partial<Record<"q" | "cat" | "brand" | "min" | "max" | "stock" | "sort", string | null>>) => {
    const next = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const data = snap?.data;
  const threshold = data?.settings.lowStockThreshold ?? 5;
  const catById = useMemo(() => new Map((data?.categories ?? []).map((c) => [c.id, c])), [data?.categories]);

  // Products in scope before brand/price/stock filters (for facet options)
  const scoped = useMemo(() => (data?.products ?? []).filter((p) =>
    isPublic(p)
    && (category ? p.categoryId === category.id : f.cats.length === 0 || f.cats.includes(p.categoryId))
    && matches(p, catById.get(p.categoryId), f.q),
  ), [data?.products, category, f.cats, f.q, catById]);

  const brands = useMemo(() => {
    const m = new Map<string, number>();
    scoped.forEach((p) => m.set(p.brand, (m.get(p.brand) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [scoped]);

  const results = useMemo(() => {
    const r = scoped.filter((p) => {
      if (f.brands.length && !f.brands.includes(p.brand)) return false;
      const vs = publicVariants(p).filter((v) => (f.min === undefined || v.price >= f.min) && (f.max === undefined || v.price <= f.max));
      if (!vs.length) return false;
      if (f.inStock && !vs.some((v) => v.stock > 0)) return false;
      return true;
    });
    const lo = (p: Product) => priceRange(p)[0];
    switch (f.sort) {
      case "price-asc": return r.sort((a, b) => lo(a) - lo(b));
      case "price-desc": return r.sort((a, b) => lo(b) - lo(a));
      case "newest": return r.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      default: return r.sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.variants.some((v) => v.stock > 0)) - Number(a.variants.some((v) => v.stock > 0)));
    }
  }, [scoped, f.brands, f.min, f.max, f.inStock, f.sort]);

  const chips: { label: string; clear: () => void }[] = [];
  if (f.q) chips.push({ label: `“${f.q}”`, clear: () => update({ q: null }) });
  if (!category) f.cats.forEach((c) => chips.push({ label: catById.get(c)?.name ?? c, clear: () => update({ cat: f.cats.filter((x) => x !== c).join(",") || null }) }));
  f.brands.forEach((b) => chips.push({ label: b, clear: () => update({ brand: f.brands.filter((x) => x !== b).join(",") || null }) }));
  if (f.min !== undefined || f.max !== undefined)
    chips.push({ label: f.max === undefined ? `Over ${money(f.min!)}` : f.min === undefined ? `Under ${money(f.max)}` : `${money(f.min)} – ${money(f.max)}`, clear: () => update({ min: null, max: null }) });
  if (f.inStock) chips.push({ label: "In stock", clear: () => update({ stock: null }) });
  const clearAll = () => router.replace(pathname, { scroll: false });

  const toggle = (key: "cat" | "brand", list: string[], v: string) =>
    update({ [key]: (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]).join(",") || null });

  const filterPanel = (px: string) => (
    <div className="space-y-7">
      {!category && data && (
        <fieldset>
          <legend className="mb-2.5 text-[13px] font-bold uppercase tracking-wider text-text-2">Category</legend>
          <div className="space-y-2">
            {data.categories.map((c) => (
              <Checkbox key={c.id} id={`${px}-cat-${c.id}`} label={c.name} checked={f.cats.includes(c.id)} onChange={() => toggle("cat", f.cats, c.id)} />
            ))}
          </div>
        </fieldset>
      )}
      {category && data && (
        <nav aria-label="Other categories">
          <p className="mb-2.5 text-[13px] font-bold uppercase tracking-wider text-text-2">Categories</p>
          <ul className="space-y-0.5 text-sm">
            {data.categories.map((c) => (
              <li key={c.id}>
                <Link href={`/category/${c.slug}`} aria-current={c.id === category.id ? "page" : undefined}
                  className={cx("flex items-center justify-between rounded-xs px-2 py-1.5 hover:bg-sunken", c.id === category.id && "bg-brand-50 font-semibold text-brand-700")}>
                  {c.name} <ChevronRight className="h-3.5 w-3.5 text-text-3" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <fieldset>
        <legend className="mb-2.5 text-[13px] font-bold uppercase tracking-wider text-text-2">Budget</legend>
        <div className="flex flex-wrap gap-1.5">
          {BUDGETS.map((b) => {
            const on = f.min === b.min && f.max === b.max;
            return (
              <button key={b.label} type="button" aria-pressed={on}
                onClick={() => update(on ? { min: null, max: null } : { min: b.min?.toString() ?? null, max: b.max?.toString() ?? null })}
                className={cx("rounded-xs border px-2 py-1 text-[13px] font-medium", on ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line-strong bg-surface hover:border-ink-700")}>
                {b.label}
              </button>
            );
          })}
        </div>
        <PriceInputs px={px} key={`${f.min}-${f.max}`} min={f.min} max={f.max} onApply={(min, max) => update({ min: min?.toString() ?? null, max: max?.toString() ?? null })} />
      </fieldset>
      {brands.length > 0 && (
        <fieldset>
          <legend className="mb-2.5 text-[13px] font-bold uppercase tracking-wider text-text-2">Brand</legend>
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {brands.map(([b, n]) => (
              <Checkbox key={b} id={`${px}-brand-${b}`} label={<>{b} <span className="num font-normal text-text-3">({n})</span></>}
                checked={f.brands.includes(b)} onChange={() => toggle("brand", f.brands, b)} />
            ))}
          </div>
        </fieldset>
      )}
      <fieldset>
        <legend className="mb-2.5 text-[13px] font-bold uppercase tracking-wider text-text-2">Availability</legend>
        <Checkbox id={`${px}-stock`} label="In stock only" checked={f.inStock} onChange={(v) => update({ stock: v ? "1" : null })} />
      </fieldset>
    </div>
  );

  const title = category ? category.name : f.q ? `Results for “${f.q}”` : "All products";

  return (
    <div className="container-page pt-6 md:pt-8">
      <nav aria-label="Breadcrumb" className="mb-3 text-[13px] text-text-3">
        <ol className="flex items-center gap-1.5">
          <li><Link href="/" className="hover:text-text">Home</Link></li>
          <li aria-hidden>/</li>
          {category ? <><li><Link href="/products" className="hover:text-text">Products</Link></li><li aria-hidden>/</li><li aria-current="page" className="text-text-2">{category.name}</li></>
            : <li aria-current="page" className="text-text-2">Products</li>}
        </ol>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <h1 className="text-[28px] sm:text-[34px]">{title}</h1>
          <p className="mt-1 text-sm text-text-2">
            {snap ? `${results.length} ${results.length === 1 ? "product" : "products"}` : "Loading products…"}
            {category && <> · {category.blurb}</>}
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Button variant="outline" className="lg:hidden" onClick={() => setDrawer(true)}>
            <SlidersHorizontal className="h-4 w-4" aria-hidden /> Filters{chips.length > 0 && <span className="num rounded-xs bg-brand-600 px-1.5 text-[11px] text-white">{chips.length}</span>}
          </Button>
          <label htmlFor="sort" className="sr-only">Sort products</label>
          <Select id="sort" value={f.sort} onChange={(e) => update({ sort: e.target.value === "featured" ? null : e.target.value })} className="min-w-0 flex-1 sm:w-52 sm:flex-none">
            {SORTS.map((s) => <option key={s.value} value={s.value}>Sort: {s.label}</option>)}
          </Select>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 py-3" aria-label="Active filters">
          {chips.map((c) => (
            <button key={c.label} onClick={c.clear} className="flex items-center gap-1 rounded-xs bg-ink-800 py-1 pl-2.5 pr-1.5 text-[13px] font-medium text-white hover:bg-ink-900"
              aria-label={`Remove filter ${c.label}`}>
              {c.label} <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          ))}
          <button onClick={clearAll} className="px-1 text-[13px] font-semibold text-brand-600 underline-offset-2 hover:underline">Clear all</button>
        </div>
      )}

      <div className="mt-5 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">{filterPanel("side")}</aside>
        <section aria-label="Products">
          {!snap ? <ProductGridSkeleton />
            : results.length === 0 ? (
              <EmptyState icon={<SearchX />} title="No products match"
                body={f.q ? `We couldn't find anything for “${f.q}” with these filters. Try a shorter word, or clear the filters.` : "Try removing a filter or two."}
                action={<><Button variant="outline" onClick={clearAll}>Clear filters</Button><Link href="/products" className="inline-flex h-10 items-center rounded-sm bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700">See all products</Link></>} />
            ) : <ProductGrid products={results} threshold={threshold} />}
        </section>
      </div>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Filters" width="max-w-sm"
        footer={<div className="flex gap-2"><Button variant="outline" onClick={clearAll} className="flex-1">Clear all</Button><Button onClick={() => setDrawer(false)} className="flex-1">Show {results.length} results</Button></div>}>
        <div className="px-5 py-5">{filterPanel("drawer")}</div>
      </Drawer>
    </div>
  );
}

function PriceInputs({ px, min, max, onApply }: { px: string; min?: number; max?: number; onApply: (min?: number, max?: number) => void }) {
  const [lo, setLo] = useState(min?.toString() ?? "");
  const [hi, setHi] = useState(max?.toString() ?? "");
  const parse = (s: string) => (/^\d+$/.test(s.trim()) ? parseInt(s, 10) : undefined);
  return (
    <form className="mt-3 flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); let a = parse(lo), b = parse(hi); if (a !== undefined && b !== undefined && a > b) [a, b] = [b, a]; onApply(a, b); }}>
      <div className="flex-1">
        <label htmlFor={`${px}-pmin`} className="text-[12px] text-text-3">Min KES</label>
        <Input id={`${px}-pmin`} inputMode="numeric" value={lo} onChange={(e) => setLo(e.target.value.replace(/\D/g, ""))} className="h-9 text-sm" />
      </div>
      <div className="flex-1">
        <label htmlFor={`${px}-pmax`} className="text-[12px] text-text-3">Max KES</label>
        <Input id={`${px}-pmax`} inputMode="numeric" value={hi} onChange={(e) => setHi(e.target.value.replace(/\D/g, ""))} className="h-9 text-sm" />
      </div>
      <Button type="submit" variant="outline" size="sm" className="h-9">Go</Button>
    </form>
  );
}

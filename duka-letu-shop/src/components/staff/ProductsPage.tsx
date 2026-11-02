"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Boxes, Plus, Search, Pencil, Trash2, Eye, EyeOff, ImagePlus, X, Star, Info, ExternalLink, LoaderCircle } from "lucide-react";
import type { Product } from "@/types";
import { useStaff } from "@/hooks/useApp";
import { deleteProduct, saveProduct, setPublished, type ProductInput, type VariantInput } from "@/lib/actions";
import { productStockLevel, totalStock } from "@/lib/calculations";
import { money } from "@/lib/format";
import { can } from "@/lib/permissions";
import { storeImage } from "@/lib/images";
import { useToast } from "../shared/toast";
import { ProductImage } from "../shared/ProductImage";
import { LevelBadge } from "../shared/bits";
import { Badge, Button, Checkbox, ConfirmDialog, Dialog, EmptyState, Field, Input, Select, Skeleton, Textarea, cx } from "../shared/ui";
import { PageHeader } from "./StaffShell";

type StatusFilter = "" | "live" | "hidden";
type SortKey = "updated" | "name" | "stock";

interface Draft {
  id?: string;
  name: string; categoryId: string; brand: string; description: string; images: string[]; published: boolean; featured: boolean;
  variants: (Omit<VariantInput, "price" | "openingStock"> & { price: string; openingStock: string; stock?: number })[];
}

const emptyDraft = (cat: string): Draft => ({
  name: "", categoryId: cat, brand: "", description: "", images: [], published: true, featured: false,
  variants: [{ label: "Standard", sku: "", price: "", openingStock: "0" }],
});
const toDraft = (p: Product): Draft => ({
  id: p.id, name: p.name, categoryId: p.categoryId, brand: p.brand, description: p.description, images: [...p.images], published: p.published, featured: p.featured,
  variants: p.variants.map((v) => ({ id: v.id, label: v.label, sku: v.sku, price: String(v.price), openingStock: "0", stock: v.stock })),
});

function ProductForm({ initial, onClose }: { initial: Draft; onClose: () => void }) {
  const { snap, staff } = useStaff();
  const { attempt, toast } = useToast();
  const [d, setD] = useState<Draft>(initial);
  const [uploading, setUploading] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const showPrices = can(staff, "prices.edit");
  const isNew = !d.id;
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const setV = (i: number, patch: Partial<Draft["variants"][number]>) => setD((x) => ({ ...x, variants: x.variants.map((v, k) => (k === i ? { ...v, ...patch } : v)) }));

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = [...files].slice(0, 6 - d.images.length);
    if (list.length < files.length) toast({ kind: "info", title: "Up to 6 photos per product" });
    setUploading((n) => n + list.length);
    for (const f of list) {
      try {
        const { ref } = await storeImage(f);
        setD((x) => ({ ...x, images: [...x.images, ref] }));
      } catch (e) {
        toast({ kind: "error", title: e instanceof Error ? e.message : "Could not add that photo." });
      } finally { setUploading((n) => n - 1); }
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (d.name.trim().length < 3) errs.name = "Enter a product name (3+ characters).";
    d.variants.forEach((v, i) => {
      if (!v.label.trim()) errs[`v${i}label`] = "Label needed";
      if (showPrices && !/^\d+$/.test(v.price.trim())) errs[`v${i}price`] = "Whole KES";
      if (!v.id && !/^\d+$/.test(v.openingStock.trim())) errs[`v${i}stock`] = "0 or more";
    });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const input: ProductInput = {
      id: d.id, name: d.name, categoryId: d.categoryId, brand: d.brand, description: d.description, images: d.images, published: d.published, featured: d.featured,
      variants: d.variants.map((v) => ({ id: v.id, label: v.label, sku: v.sku, price: showPrices ? parseInt(v.price, 10) : null, openingStock: v.id ? 0 : parseInt(v.openingStock, 10) })),
    };
    const saved = attempt(() => saveProduct(input));
    if (saved) {
      toast({ kind: "success", title: isNew ? "Product added" : "Changes saved",
        body: d.published && !saved.published ? "Saved as hidden: the owner needs to set prices before it goes live." : saved.published ? "Live on the storefront now." : "Hidden from the storefront." });
      onClose();
    }
  };

  return (
    <Dialog open onClose={onClose} size="lg" title={isNew ? "Add product" : "Edit product"} description={isNew ? undefined : d.name}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" form="pform" disabled={uploading > 0}>{isNew ? "Add product" : "Save changes"}</Button></>}>
      <form id="pform" onSubmit={submit} noValidate className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product name" htmlFor="p-name" error={errors.name} className="sm:col-span-2">
            <Input id="p-name" value={d.name} onChange={(e) => set("name", e.target.value)} invalid={!!errors.name} data-autofocus />
          </Field>
          <Field label="Category" htmlFor="p-cat">
            <Select id="p-cat" value={d.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              {snap?.data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Brand" htmlFor="p-brand" hint="Leave blank for “Generic”.">
            <Input id="p-brand" value={d.brand} onChange={(e) => set("brand", e.target.value)} list="brand-list" aria-describedby="p-brand-hint" />
            <datalist id="brand-list">{[...new Set(snap?.data.products.map((p) => p.brand))].map((b) => <option key={b} value={b} />)}</datalist>
          </Field>
          <Field label="Description" htmlFor="p-desc" className="sm:col-span-2">
            <Textarea id="p-desc" rows={3} value={d.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
        </div>

        <fieldset>
          <legend className="mb-2 text-[13px] font-semibold">Photos <span className="font-normal text-text-3">· first photo is the main one · resized automatically</span></legend>
          <div className="flex flex-wrap gap-2">
            {d.images.map((src, i) => (
              <div key={src + i} className="group relative">
                <ProductImage src={src} alt={`Photo ${i + 1}`} className={cx("h-24 w-24 rounded-sm border", i === 0 ? "border-brand-600" : "border-line")} />
                {i === 0 ? <span className="absolute bottom-1 left-1 rounded-xs bg-brand-600 px-1 text-[10px] font-bold text-white">MAIN</span>
                  : <button type="button" onClick={() => set("images", [src, ...d.images.filter((_, k) => k !== i)])} className="absolute bottom-1 left-1 rounded-xs bg-surface/90 px-1 text-[10px] font-bold hover:bg-surface" aria-label={`Make photo ${i + 1} the main photo`}>Make main</button>}
                <button type="button" onClick={() => set("images", d.images.filter((_, k) => k !== i))} aria-label={`Remove photo ${i + 1}`}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink-900/80 text-white hover:bg-ink-900"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            {Array.from({ length: uploading }, (_, i) => <div key={`u${i}`} className="flex h-24 w-24 items-center justify-center rounded-sm border border-dashed border-line-strong"><LoaderCircle className="h-5 w-5 animate-spin text-text-3" aria-label="Processing photo" /></div>)}
            {d.images.length + uploading < 6 && (
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-line-strong text-[12px] font-semibold text-text-2 hover:border-brand-600 hover:text-brand-700 focus-within:ring-2 focus-within:ring-brand-500">
                <ImagePlus className="h-5 w-5" aria-hidden /> Add photo
                <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} />
              </label>
            )}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-[13px] font-semibold">Variants <span className="font-normal text-text-3">· wattage, colour, size… each with its own {showPrices ? "price and " : ""}stock</span></legend>
          {!showPrices && (
            <p className="mb-3 flex items-start gap-2 rounded-sm bg-info-100 px-3 py-2 text-[13px] text-info-600"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> Prices are set by the owner. New variants stay hidden from customers until priced.</p>
          )}
          <div className="space-y-2">
            {d.variants.map((v, i) => (
              <div key={v.id ?? `new${i}`} className="grid grid-cols-2 items-start gap-2 rounded-sm border border-line bg-canvas/60 p-2.5 sm:grid-cols-[1.4fr_1fr_0.9fr_0.8fr_auto]">
                <Field label="Label" htmlFor={`v${i}l`} error={errors[`v${i}label`]} className="col-span-2 sm:col-span-1">
                  <Input id={`v${i}l`} value={v.label} onChange={(e) => setV(i, { label: e.target.value })} placeholder="e.g. 9W or Red" invalid={!!errors[`v${i}label`]} className="h-9" />
                </Field>
                <Field label="SKU" htmlFor={`v${i}s`}>
                  <Input id={`v${i}s`} value={v.sku} onChange={(e) => setV(i, { sku: e.target.value.toUpperCase() })} placeholder="Auto" className="num h-9" />
                </Field>
                {showPrices ? (
                  <Field label="Price (KES)" htmlFor={`v${i}p`} error={errors[`v${i}price`]}>
                    <Input id={`v${i}p`} inputMode="numeric" value={v.price} onChange={(e) => setV(i, { price: e.target.value.replace(/\D/g, "") })} invalid={!!errors[`v${i}price`]} className="num h-9" />
                  </Field>
                ) : <div className="hidden sm:block" />}
                {v.id ? (
                  <div className="flex flex-col gap-1.5"><span className="text-[13px] font-semibold">Stock</span>
                    <span className="num flex h-9 items-center text-sm" title="Change stock in Inventory">{v.stock} <Link href="/staff/inventory" className="ml-1.5 text-[12px] font-semibold text-brand-600 hover:underline">adjust</Link></span></div>
                ) : (
                  <Field label="Opening stock" htmlFor={`v${i}o`} error={errors[`v${i}stock`]}>
                    <Input id={`v${i}o`} inputMode="numeric" value={v.openingStock} onChange={(e) => setV(i, { openingStock: e.target.value.replace(/\D/g, "") })} className="num h-9" />
                  </Field>
                )}
                <Button variant="ghost" size="icon-sm" className="mt-6 justify-self-end" disabled={d.variants.length === 1}
                  onClick={() => setD((x) => ({ ...x, variants: x.variants.filter((_, k) => k !== i) }))} aria-label={`Remove variant ${v.label || i + 1}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setD((x) => ({ ...x, variants: [...x.variants, { label: "", sku: "", price: "", openingStock: "0" }] }))}>
            <Plus className="h-4 w-4" aria-hidden /> Add variant
          </Button>
        </fieldset>

        <div className="grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
          <Checkbox id="p-pub" label="Published" description="Visible and orderable on the storefront." checked={d.published} onChange={(v) => set("published", v)} />
          <Checkbox id="p-feat" label="Featured" description="Shown in Featured products on the homepage." checked={d.featured} onChange={(v) => set("featured", v)} />
        </div>
      </form>
    </Dialog>
  );
}

export function ProductsPage() {
  const { snap, staff } = useStaff();
  const { attempt } = useToast();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [sort, setSort] = useState<SortKey>("updated");
  const [editing, setEditing] = useState<Draft | null>(null);
  const [del, setDel] = useState<Product | null>(null);
  const showPrices = can(staff, "prices.view");
  const canDelete = can(staff, "products.delete");

  const list = useMemo(() => {
    if (!snap) return [];
    const t = q.trim().toLowerCase();
    const r = snap.data.products.filter((p) => (!cat || p.categoryId === cat) && (!status || (status === "live" ? p.published : !p.published))
      && (!t || `${p.name} ${p.brand} ${p.sku} ${p.variants.map((v) => v.sku + " " + v.label).join(" ")}`.toLowerCase().includes(t)));
    return r.sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "stock" ? totalStock(a) - totalStock(b) : b.updatedAt.localeCompare(a.updatedAt));
  }, [snap, q, cat, status, sort]);

  if (!snap) return <><Skeleton className="mb-6 h-9 w-40" /><Skeleton className="h-96 rounded-md" /></>;
  const cats = new Map(snap.data.categories.map((c) => [c.id, c.name]));
  const th = snap.data.settings.lowStockThreshold;
  const unconfirmed = snap.data.products.filter((p) => p.nameUnconfirmed).length;

  return (
    <div>
      <PageHeader title="Products" sub={`${snap.data.products.length} products · ${snap.data.products.filter((p) => p.published).length} live on the storefront`}
        actions={<Button onClick={() => setEditing(emptyDraft(cat || snap.data.categories[0].id))}><Plus className="h-4 w-4" aria-hidden /> Add product</Button>} />

      <p className="mb-4 flex items-start gap-2 rounded-sm border border-marigold-200 bg-marigold-100/60 px-3 py-2 text-[13px] text-[#6b4a07]">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>Demonstration catalogue built from the shop’s status photos. {showPrices ? "Prices and stock" : "Stock levels"} are sample values. {unconfirmed} product names were read from photos and are marked <b>To confirm</b>.</span>
      </p>

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_180px_150px_170px]">
        <div className="relative">
          <label htmlFor="pr-q" className="sr-only">Search products</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" aria-hidden />
          <Input id="pr-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, brand or SKU" className="pl-9" />
        </div>
        <div><label htmlFor="pr-cat" className="sr-only">Category</label>
          <Select id="pr-cat" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All categories</option>{snap.data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
        <div><label htmlFor="pr-st" className="sr-only">Status</label>
          <Select id="pr-st" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}><option value="">Live & hidden</option><option value="live">Live only</option><option value="hidden">Hidden only</option></Select></div>
        <div><label htmlFor="pr-sort" className="sr-only">Sort</label>
          <Select id="pr-sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}><option value="updated">Recently updated</option><option value="name">Name A–Z</option><option value="stock">Lowest stock first</option></Select></div>
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-surface">
        {list.length === 0 ? <EmptyState icon={<Boxes />} title="No products found" body="Try a different search or filter." /> : (
          <ul className="divide-y divide-line">
            {list.map((p) => {
              const prices = p.variants.map((v) => v.price).filter((x) => x > 0);
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap">
                  <ProductImage src={p.images[0]} alt="" className="h-14 w-14 shrink-0 rounded-sm" />
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="flex flex-wrap items-center gap-1.5">
                      <button onClick={() => setEditing(toDraft(p))} className="truncate text-left text-sm font-semibold hover:text-brand-700 hover:underline">{p.name}</button>
                      {p.nameUnconfirmed && <Badge tone="accent">To confirm</Badge>}
                      {p.featured && <Star className="h-3.5 w-3.5 fill-marigold-500 text-marigold-500" aria-label="Featured" />}
                    </p>
                    <p className="num text-[12px] text-text-3">{p.sku} · {cats.get(p.categoryId)} · {p.brand} · {p.variants.length} {p.variants.length === 1 ? "variant" : "variants"}</p>
                  </div>
                  {showPrices && (
                    <span className="num hidden w-32 text-right text-sm font-semibold md:block">
                      {prices.length === 0 ? <Badge tone="warning">Needs price</Badge> : Math.min(...prices) === Math.max(...prices) ? money(prices[0]) : `${money(Math.min(...prices))}+`}
                    </span>
                  )}
                  <span className="hidden w-28 lg:block"><LevelBadge level={productStockLevel(p, th)} /><span className="num block text-[12px] text-text-3">{totalStock(p)} units</span></span>
                  <span className="w-20">{p.published ? <Badge tone="success">Live</Badge> : <Badge>Hidden</Badge>}</span>
                  <div className="ml-auto flex items-center gap-1">
                    <Button variant="ghost" size="icon-sm" aria-label={p.published ? `Hide ${p.name}` : `Publish ${p.name}`} title={p.published ? "Hide from storefront" : "Publish"}
                      onClick={() => attempt(() => setPublished(p.id, !p.published), (r) => r.published ? `${r.name} is live` : `${r.name} hidden`)}>
                      {p.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label={`Edit ${p.name}`} title="Edit" onClick={() => setEditing(toDraft(p))}><Pencil className="h-4 w-4" /></Button>
                    {p.published && <Link href={`/product/${p.slug}`} target="_blank" className="flex h-8 w-8 items-center justify-center rounded-sm text-text hover:bg-sunken" aria-label={`View ${p.name} on storefront`} title="View on storefront"><ExternalLink className="h-4 w-4" /></Link>}
                    {canDelete && <Button variant="ghost" size="icon-sm" aria-label={`Delete ${p.name}`} title="Delete" onClick={() => setDel(p)} className="text-danger-600"><Trash2 className="h-4 w-4" /></Button>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {editing && <ProductForm initial={editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title={`Delete ${del?.name}?`} confirmLabel="Delete product"
        body="It disappears from the storefront and the till. Past orders and the stock log keep their records. This can’t be undone (except by resetting the demo)."
        onConfirm={() => { if (del && attempt(() => { deleteProduct(del.id); return true; }, `${del.name} deleted`)) setDel(null); }} />
    </div>
  );
}

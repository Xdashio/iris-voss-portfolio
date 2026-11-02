"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PackageX, ShoppingBag, Store, Truck, Smartphone, Check } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import { isPublic, publicVariants, stockLevel } from "@/lib/calculations";
import { addToCart } from "@/lib/actions";
import { money } from "@/lib/format";
import { useToast } from "../shared/toast";
import { ProductImage } from "../shared/ProductImage";
import { Price, StockBadge } from "../shared/bits";
import { Button, EmptyState, QtyStepper, Skeleton, cx } from "../shared/ui";
import { ProductGrid } from "./ProductCard";

function optionName(labels: string[]): string {
  if (labels.every((l) => /\d+\s*W\b/.test(l))) return "Wattage";
  if (labels.every((l) => /^[A-Z][a-z]+( \/ [A-Z][a-z]+)?$/.test(l))) return "Colour";
  if (labels.some((l) => /(cm|m cable|"|kg|L\b|mm)/.test(l))) return "Size";
  return "Option";
}

export function ProductDetail({ slug }: { slug: string }) {
  const snap = useApp();
  const router = useRouter();
  const { toast, attempt } = useToast();
  const product = snap?.data.products.find((p) => p.slug === slug);
  const variants = useMemo(() => (product ? publicVariants(product) : []), [product]);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [img, setImg] = useState(0);
  const [qty, setQty] = useState(1);

  // Default to the first in-stock variant.
  useEffect(() => {
    if (!variants.length) return;
    if (!variantId || !variants.some((v) => v.id === variantId)) setVariantId((variants.find((v) => v.stock > 0) ?? variants[0]).id);
  }, [variants, variantId]);

  if (!snap) {
    return (
      <div className="container-page grid gap-8 pt-8 md:grid-cols-2">
        <Skeleton className="aspect-square rounded-md" />
        <div className="space-y-4"><Skeleton className="h-4 w-24" /><Skeleton className="h-9 w-4/5" /><Skeleton className="h-8 w-32" /><Skeleton className="h-24 w-full" /><Skeleton className="h-12 w-full" /></div>
      </div>
    );
  }

  if (!product || !isPublic(product)) {
    return (
      <div className="container-page">
        <h1 className="sr-only">Product not available</h1>
        <EmptyState icon={<PackageX />} title="This product isn't available" body="It may have been removed or is temporarily hidden. Have a look at similar items instead."
          action={<Link href="/products" className="inline-flex h-10 items-center rounded-sm bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700">Browse products</Link>} />
      </div>
    );
  }

  const data = snap.data;
  const threshold = data.settings.lowStockThreshold;
  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  const inCart = snap.cart.find((l) => l.productId === product.id && l.variantId === variant.id)?.qty ?? 0;
  const room = Math.max(0, variant.stock - inCart);
  const q = Math.min(Math.max(1, qty), Math.max(1, room));
  const category = data.categories.find((c) => c.id === product.categoryId);
  const related = data.products.filter((p) => p.id !== product.id && p.categoryId === product.categoryId && isPublic(p)).slice(0, 4);
  const optName = optionName(variants.map((v) => v.label));
  const images = product.images.length ? product.images : [""];

  const add = (thenCheckout: boolean) => {
    const r = attempt(() => addToCart(product.id, variant.id, q));
    if (!r) return;
    setQty(1);
    if (thenCheckout) { router.push("/checkout"); return; }
    toast({
      kind: "success",
      title: r.capped ? `Added ${r.added} (all we have)` : `Added ${r.added} to cart`,
      body: `${product.name} · ${variant.label}`,
      action: { label: "View cart", onClick: () => router.push("/cart") },
    });
  };

  return (
    <div className="container-page pt-5 md:pt-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-text-3">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-text">Home</Link></li><li aria-hidden>/</li>
          {category && <><li><Link href={`/category/${category.slug}`} className="hover:text-text">{category.name}</Link></li><li aria-hidden>/</li></>}
          <li aria-current="page" className="line-clamp-1 text-text-2">{product.name}</li>
        </ol>
      </nav>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-10 lg:gap-14">
        {/* Gallery */}
        <div className="md:sticky md:top-40 md:self-start">
          <ProductImage src={images[img]} alt={`${product.name}, photo ${img + 1} of ${images.length}`} fit="contain" priority
            className="aspect-square rounded-md border border-line bg-surface" />
          {images.length > 1 && (
            <div className="mt-3 flex gap-2" role="group" aria-label="Product photos">
              {images.map((src, i) => (
                <button key={src + i} type="button" onClick={() => setImg(i)} aria-label={`Show photo ${i + 1}`} aria-pressed={i === img}
                  className={cx("w-20 overflow-hidden rounded-sm border-2", i === img ? "border-brand-600" : "border-transparent hover:border-line-strong")}>
                  <ProductImage src={src} alt="" className="aspect-square" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wider text-text-3">{product.brand}</p>
          <h1 className="mt-1 text-[26px] sm:text-[32px]">{product.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Price value={variant.price} size="xl" />
            <StockBadge stock={variant.stock} threshold={threshold} showCount />
          </div>
          <p className="mt-1 text-[13px] text-text-3">SKU {variant.sku}</p>

          {variants.length > 1 && (
            <fieldset className="mt-6">
              <legend className="mb-2 text-sm font-semibold">{optName}: <span className="font-normal text-text-2">{variant.label}</span></legend>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const out = v.stock <= 0;
                  const sel = v.id === variant.id;
                  return (
                    <button key={v.id} type="button" onClick={() => { setVariantId(v.id); setQty(1); }} aria-pressed={sel}
                      className={cx(
                        "relative min-w-[64px] rounded-sm border px-3 py-2 text-left text-sm transition-colors",
                        sel ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600" : "border-line-strong bg-surface hover:border-ink-700",
                        out && "text-text-3",
                      )}>
                      <span className={cx("block font-semibold", out && "line-through decoration-1")}>{v.label}</span>
                      <span className="num block text-[12px] text-text-2">{out ? "Sold out" : money(v.price)}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {variant.stock > 0 && room > 0 && (
              <QtyStepper value={q} max={room} onChange={setQty} />
            )}
            <div className="flex min-w-0 flex-1 gap-2">
              <Button size="lg" className="flex-1" onClick={() => add(false)} disabled={variant.stock <= 0 || room <= 0}>
                <ShoppingBag className="h-5 w-5" aria-hidden /> {variant.stock <= 0 ? "Out of stock" : room <= 0 ? "All in your cart" : "Add to cart"}
              </Button>
              <Button size="lg" variant="accent" className="max-sm:hidden" onClick={() => add(true)} disabled={variant.stock <= 0 || room <= 0}>
                Buy now
              </Button>
            </div>
          </div>
          {inCart > 0 && (
            <p className="mt-2.5 flex items-center gap-1.5 text-[13px] text-success-600">
              <Check className="h-4 w-4" aria-hidden /> {inCart} in your cart · <Link href="/cart" className="font-semibold underline underline-offset-2">View cart</Link>
            </p>
          )}
          {stockLevel(variant.stock, threshold) === "low" && variant.stock > 0 && (
            <p className="mt-2 text-[13px] font-medium text-warning-600">Only {variant.stock} left on the shelf.</p>
          )}

          <div className="mt-8 border-t border-line pt-6">
            <h2 className="font-sans text-[15px] font-bold">About this product</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-text-2">{product.description || "No description yet."}</p>
          </div>

          <ul className="mt-6 divide-y divide-line rounded-md border border-line bg-surface text-sm">
            <li className="flex gap-3 p-3.5"><Store className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden /><span><b>Free pickup</b> from the shop. {data.settings.hours}</span></li>
            <li className="flex gap-3 p-3.5"><Truck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden /><span><b>Delivery in town</b> from {money(Math.min(...data.settings.zones.map((z) => z.fee)))}, by zone.</span></li>
            <li className="flex gap-3 p-3.5"><Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden /><span><b>M-Pesa</b> Till or Paybill, or cash when you collect.</span></li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14" aria-labelledby="rel-title">
          <h2 id="rel-title" className="mb-5 text-[24px]">More in {category?.name}</h2>
          <ProductGrid products={related} threshold={threshold} />
        </section>
      )}

      {/* Mobile sticky buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-surface px-4 py-3 shadow-[0_-4px_16px_rgb(11_42_47/0.08)] sm:hidden">
        <div className="min-w-0 flex-1"><Price value={variant.price * q} size="lg" /><span className="block truncate text-[12px] text-text-3">{q} × {variant.label}</span></div>
        <Button variant="accent" size="lg" onClick={() => add(true)} disabled={variant.stock <= 0 || room <= 0}>Buy now</Button>
      </div>
      <div className="h-16 sm:hidden" aria-hidden />
    </div>
  );
}

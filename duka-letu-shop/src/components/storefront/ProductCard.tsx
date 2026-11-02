"use client";

import Link from "next/link";
import { Plus, Check } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/types";
import { priceRange, productStockLevel, publicVariants } from "@/lib/calculations";
import { addToCart } from "@/lib/actions";
import { money } from "@/lib/format";
import { useToast } from "../shared/toast";
import { ProductImage } from "../shared/ProductImage";
import { LevelBadge } from "../shared/bits";
import { Badge, cx } from "../shared/ui";

const NEW_DAYS = 14;

function optionSummary(p: Product): string | null {
  const vs = publicVariants(p);
  if (vs.length < 2) return null;
  const colourish = vs.every((v) => /^[A-Z][a-z]+( \/ [A-Z][a-z]+)?$/.test(v.label));
  return `${vs.length} ${colourish ? "colours" : "options"}`;
}

export function ProductCard({ product: p, threshold, priority }: { product: Product; threshold: number; priority?: boolean }) {
  const { toast, attempt } = useToast();
  const [justAdded, setJustAdded] = useState(false);
  const vs = publicVariants(p);
  const [lo, hi] = priceRange(p);
  const level = productStockLevel(p, threshold);
  const isNew = Date.now() - new Date(p.createdAt).getTime() < NEW_DAYS * 86_400_000;
  const opts = optionSummary(p);
  const single = vs.length === 1 ? vs[0] : null;
  const href = `/product/${p.slug}`;

  return (
    <article className="group relative flex flex-col rounded-md border border-line bg-surface transition-colors hover:border-line-strong">
      <Link href={href} className="block overflow-hidden rounded-t-md" tabIndex={-1} aria-hidden>
        <ProductImage src={p.images[0]} alt="" priority={priority}
          className="aspect-square transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transform-none" />
      </Link>
      <div className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1">
        {isNew && <Badge tone="clay">New</Badge>}
        {level !== "in" && <LevelBadge level={level} />}
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        <p className="truncate text-[11px] font-bold uppercase tracking-wider text-text-3">{p.brand}</p>
        <h3 className="mt-0.5 font-sans text-[14px] font-semibold leading-snug sm:text-[15px]">
          <Link href={href} className="line-clamp-2 min-h-[2.6em] after:absolute after:inset-0 after:content-[''] focus:outline-none">
            {p.name}
          </Link>
        </h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            {lo !== hi && <span className="block text-[11px] text-text-3">from</span>}
            <span className="num font-display text-[17px] font-bold leading-none tracking-tight sm:text-lg">{money(lo)}</span>
            {opts && <span className="mt-1 block text-[12px] text-text-3">{opts}</span>}
          </div>
          {single ? (
            <button
              type="button"
              disabled={level === "out"}
              onClick={() => {
                const r = attempt(() => addToCart(p.id, single.id, 1));
                if (r) {
                  setJustAdded(true);
                  setTimeout(() => setJustAdded(false), 1400);
                  toast({ kind: "success", title: "Added to cart", body: p.name });
                }
              }}
              aria-label={level === "out" ? `${p.name} is out of stock` : `Add ${p.name} to cart`}
              className={cx(
                "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm transition-colors",
                level === "out" ? "bg-sunken text-text-3" : justAdded ? "bg-success-600 text-white" : "bg-brand-600 text-white hover:bg-brand-700",
              )}
            >
              {justAdded ? <Check className="h-4.5 w-4.5" aria-hidden /> : <Plus className="h-4.5 w-4.5" aria-hidden />}
            </button>
          ) : (
            <span className="relative z-10 shrink-0 rounded-sm border border-line-strong px-2 py-1.5 text-[12px] font-semibold text-text-2 group-hover:border-ink-700 group-hover:text-text">
              Choose
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, threshold, className }: { products: Product[]; threshold: number; className?: string }) {
  return (
    <ul className={cx("grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4", className)}>
      {products.map((p, i) => (
        <li key={p.id} className="flex"><div className="flex w-full flex-col [&>article]:flex-1"><ProductCard product={p} threshold={threshold} priority={i < 4} /></div></li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4" aria-label="Loading products">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="rounded-md border border-line bg-surface">
          <div className="skeleton aspect-square rounded-t-md" />
          <div className="space-y-2 p-3.5">
            <div className="skeleton h-3 w-16 rounded-xs" />
            <div className="skeleton h-4 w-full rounded-xs" />
            <div className="skeleton h-4 w-2/3 rounded-xs" />
            <div className="skeleton mt-4 h-5 w-24 rounded-xs" />
          </div>
        </li>
      ))}
    </ul>
  );
}

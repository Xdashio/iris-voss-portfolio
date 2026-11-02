"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Store, Truck, Smartphone, PackageSearch, ShieldCheck, Tags } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import { isPublic, topSellers } from "@/lib/calculations";
import { money } from "@/lib/format";
import { ProductGrid, ProductGridSkeleton } from "./ProductCard";
import { ProductImage } from "../shared/ProductImage";
import { Icon } from "../shared/bits";

const CATEGORY_IMAGE: Record<string, string> = {
  lighting: "/products/lamp-solar-shell-1.webp",
  torches: "/products/torch-288-1.webp",
  audio: "/products/speaker-ln716bt-1.webp",
  power: "/products/ext-babastra-4way-1.webp",
  tools: "/products/pliers-aweisi-8-1.webp",
  "home-kitchen": "/products/kettle-ailyons-1.webp",
  security: "/products/cam-narobstar-ptz-1.webp",
  "tv-mounts": "/products/mount-sh45f-1.webp",
  other: "/products/gotv-gotenna-1.webp",
};

function SectionHead({ title, href, sub, id }: { title: string; href?: string; sub?: string; id?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 id={id} className="text-[24px] sm:text-[28px]">{title}</h2>
        {sub && <p className="mt-1 text-sm text-text-2">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
          See all <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export function HomePage() {
  const snap = useApp();
  const data = snap?.data;
  const threshold = data?.settings.lowStockThreshold ?? 5;

  const { featured, popular, fresh, counts } = useMemo(() => {
    if (!data) return { featured: [], popular: [], fresh: [], counts: new Map<string, number>() };
    const live = data.products.filter(isPublic);
    const byId = new Map(live.map((p) => [p.id, p]));
    const top = topSellers(data, 30, Date.now(), 12).map((t) => byId.get(t.productId)).filter((p): p is NonNullable<typeof p> => !!p && p.variants.some((v) => v.stock > 0));
    const counts = new Map<string, number>();
    live.forEach((p) => counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1));
    return {
      featured: live.filter((p) => p.featured).slice(0, 8),
      popular: top.slice(0, 4),
      fresh: [...live].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4),
      counts,
    };
  }, [data]);

  const zones = data?.settings.zones ?? [];
  const minFee = zones.length ? Math.min(...zones.map((z) => z.fee)) : 0;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-900 text-white" aria-labelledby="hero-title">
        <div className="container-page grid items-center gap-10 py-10 md:py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-16">
          <div className="anim-rise">
            <p className="mb-4 inline-flex items-center gap-2 rounded-xs bg-white/10 px-2.5 py-1 text-[12px] font-semibold uppercase tracking-wider text-marigold-500">
              <Store className="h-3.5 w-3.5" aria-hidden /> Your neighbourhood shop, now online
            </p>
            <h1 id="hero-title" className="max-w-[14ch] text-[38px] font-extrabold leading-[1.04] sm:text-[50px] lg:text-[58px]">
              Everything you need, <span className="text-marigold-500">all in one shop.</span>
            </h1>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-white/75 sm:text-[17px]">
              Discover quality lighting, electronics, hardware, and home essentials at convenient prices.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/products" className="inline-flex h-12 items-center gap-2 rounded-sm bg-marigold-500 px-6 text-[15px] font-bold text-ink-950 hover:bg-marigold-600">
                Explore Products <ArrowRight className="h-4.5 w-4.5" aria-hidden />
              </Link>
              <a href="#categories" className="inline-flex h-12 items-center rounded-sm border border-white/25 px-6 text-[15px] font-semibold text-white hover:bg-white/10">
                Browse Categories
              </a>
            </div>
            <ul className="mt-9 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6 text-[13px] text-white/70">
              <li><Store className="mb-1.5 h-5 w-5 text-marigold-500" aria-hidden /><b className="block text-white">Free pickup</b>from the shop</li>
              <li><Truck className="mb-1.5 h-5 w-5 text-marigold-500" aria-hidden /><b className="block text-white">Town delivery</b>{minFee ? `from ${money(minFee)}` : "by zone"}</li>
              <li><Smartphone className="mb-1.5 h-5 w-5 text-marigold-500" aria-hidden /><b className="block text-white">M-Pesa</b>Till or Paybill</li>
            </ul>
          </div>

          {/* Shelf mosaic: real shop photos */}
          <div className="relative hidden sm:block" aria-hidden>
            <div className="grid grid-cols-6 grid-rows-[repeat(6,minmax(0,1fr))] gap-3 lg:aspect-[1.05]">
              <ProductImage src="/products/speaker-ln726bt-1.webp" alt="" priority className="col-span-3 row-span-4 rounded-md" />
              <ProductImage src="/products/kettle-ailyons-1.webp" alt="" priority className="col-span-3 row-span-3 rounded-md" />
              <ProductImage src="/products/torch-652c-1.webp" alt="" className="col-span-3 row-span-3 rounded-md" />
              <ProductImage src="/products/lamp-solar-shell-1.webp" alt="" className="col-span-3 row-span-2 rounded-md" />
            </div>
            <div className="absolute -bottom-3 -left-3 flex items-center gap-3 rounded-md bg-surface px-4 py-3 text-text shadow-pop">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600"><Tags className="h-4.5 w-4.5" /></span>
              <span className="text-[13px] leading-tight"><b className="block font-display text-[15px]">{data ? data.products.filter(isPublic).length : "48"} products</b>across 9 departments</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="container-page scroll-mt-32 pt-12 md:pt-16" aria-labelledby="cat-title">
        <SectionHead id="cat-title" title="Shop by category" href="/products" />
        <ul className="grid grid-cols-3 gap-2.5 sm:gap-3 md:grid-cols-5 lg:grid-cols-9">
          {(data?.categories ?? []).map((c) => (
            <li key={c.id}>
              <Link href={`/category/${c.slug}`} className="group flex h-full flex-col overflow-hidden rounded-md border border-line bg-surface hover:border-ink-700">
                <ProductImage src={CATEGORY_IMAGE[c.id]} alt="" className="aspect-square" />
                <span className="flex flex-1 items-start gap-1.5 px-2 py-2 sm:px-2.5">
                  <Icon name={c.icon} className="mt-0.5 hidden h-3.5 w-3.5 shrink-0 text-brand-600 sm:block" />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold leading-tight group-hover:text-brand-700">{c.name}</span>
                    <span className="num block text-[11px] text-text-3">{counts.get(c.id) ?? 0} items</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
          {!data && Array.from({ length: 9 }, (_, i) => <li key={i}><div className="skeleton aspect-[0.8] rounded-md" /></li>)}
        </ul>
      </section>

      <section className="container-page pt-12 md:pt-16" aria-labelledby="feat-title">
        <SectionHead id="feat-title" title="Featured products" sub="Hand-picked from the shop floor" href="/products" />
        {data ? <ProductGrid products={featured} threshold={threshold} /> : <ProductGridSkeleton count={8} />}
      </section>

      {/* Delivery & payment band */}
      <section id="delivery" className="mt-14 scroll-mt-32 border-y border-line bg-surface md:mt-16" aria-labelledby="del-title">
        <div className="container-page grid gap-8 py-10 md:grid-cols-[1fr_1.6fr] md:py-12">
          <div>
            <h2 id="del-title" className="text-[24px] sm:text-[28px]">Pickup or delivery, your choice</h2>
            <p className="mt-2 max-w-sm text-sm text-text-2">Order online and collect from the shop for free, or have it brought to you anywhere in town. Track every order with your order number and phone.</p>
            <Link href="/track" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
              <PackageSearch className="h-4 w-4" aria-hidden /> Track an order
            </Link>
          </div>
          <div className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3">
            <div className="bg-surface p-5">
              <Store className="h-6 w-6 text-brand-600" aria-hidden />
              <h3 className="mt-3 font-sans text-[15px] font-bold">Shop pickup</h3>
              <p className="mt-1 text-sm text-text-2">Free. We’ll tell you when it’s packed and ready. Pay by M-Pesa or cash at the counter.</p>
            </div>
            <div className="bg-surface p-5">
              <Truck className="h-6 w-6 text-brand-600" aria-hidden />
              <h3 className="mt-3 font-sans text-[15px] font-bold">Town delivery</h3>
              <ul className="mt-1.5 space-y-1 text-sm text-text-2">
                {zones.map((z) => <li key={z.id} className="flex justify-between gap-2"><span>{z.name}</span><span className="num font-semibold text-text">{money(z.fee)}</span></li>)}
              </ul>
            </div>
            <div className="bg-surface p-5">
              <Smartphone className="h-6 w-6 text-brand-600" aria-hidden />
              <h3 className="mt-3 font-sans text-[15px] font-bold">Pay with M-Pesa</h3>
              <p className="mt-1 text-sm text-text-2">Till or Paybill at checkout. Cash is accepted for shop pickup only.</p>
            </div>
          </div>
        </div>
      </section>

      {popular.length > 0 && (
        <section className="container-page pt-12 md:pt-16" aria-labelledby="pop-title">
          <SectionHead id="pop-title" title="Popular right now" sub="What customers are buying this month" />
          <ProductGrid products={popular} threshold={threshold} />
        </section>
      )}

      <section className="container-page pt-12 md:pt-16" aria-labelledby="new-title">
        <SectionHead id="new-title" title="New arrivals" href="/products?sort=newest" />
        {data ? <ProductGrid products={fresh} threshold={threshold} /> : <ProductGridSkeleton count={4} />}
      </section>

      {/* Trust strip */}
      <section className="container-page pt-12 md:pt-16" aria-label="Why shop with us">
        <ul className="grid gap-4 rounded-md bg-brand-50 p-5 sm:grid-cols-3 sm:p-6">
          {[
            { icon: <Tags className="h-5 w-5" />, t: "Clear prices", d: "Every size and colour shows its own price. No “inbox for price”." },
            { icon: <ShieldCheck className="h-5 w-5" />, t: "Live stock", d: "What you see is on our shelf now, the same stock our till uses." },
            { icon: <PackageSearch className="h-5 w-5" />, t: "No account needed", d: "Check out as a guest and track with your order number and phone." },
          ].map((x) => (
            <li key={x.t} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-brand-600" aria-hidden>{x.icon}</span>
              <span><b className="block text-[15px]">{x.t}</b><span className="text-sm text-text-2">{x.d}</span></span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

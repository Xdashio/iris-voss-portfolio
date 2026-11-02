"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Menu, Search, ShoppingBag, PackageSearch, Truck, Smartphone, Store, ChevronRight } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import { cartCount } from "@/lib/calculations";
import { Icon, LogoMark } from "../shared/bits";
import { Button, Drawer, cx } from "../shared/ui";

function SearchBox({ id, className }: { id: string; className?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  useEffect(() => { setQ(pathname === "/products" ? params.get("q") ?? "" : ""); }, [params, pathname]);
  return (
    <form
      role="search"
      className={cx("relative flex w-full", className)}
      onSubmit={(e) => {
        e.preventDefault();
        const t = q.trim();
        router.push(t ? `/products?q=${encodeURIComponent(t)}` : "/products");
      }}
    >
      <label htmlFor={id} className="sr-only">Search products</label>
      <input
        id={id}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search bulbs, speakers, extension sockets…"
        className="h-11 w-full rounded-l-sm border border-r-0 border-line-strong bg-surface pl-3.5 pr-3 text-[15px] placeholder:text-text-3 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
      />
      <button type="submit" aria-label="Search"
        className="flex h-11 w-12 shrink-0 items-center justify-center rounded-r-sm bg-marigold-500 text-ink-950 hover:bg-marigold-600">
        <Search className="h-5 w-5" aria-hidden />
      </button>
    </form>
  );
}

export function SiteHeader() {
  const snap = useApp();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const count = snap ? cartCount(snap.cart) : 0;
  const shopName = snap?.data.settings.shopName ?? "Duka Letu";
  const tagline = snap?.data.settings.tagline ?? "Electronics, hardware & home goods";
  const cats = snap?.data.categories ?? [];
  useEffect(() => { setMenu(false); }, [pathname]);

  return (
    <header className="sticky top-0 z-40 bg-surface print:hidden">
      {/* Utility strip */}
      <div className="hidden bg-ink-900 text-[13px] text-white/80 md:block">
        <div className="container-page flex h-8 items-center gap-6">
          <span className="flex items-center gap-1.5"><Store className="h-3.5 w-3.5 text-marigold-500" aria-hidden /> Free pickup in the shop</span>
          <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-marigold-500" aria-hidden /> Delivery across town</span>
          <span className="flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5 text-marigold-500" aria-hidden /> Pay with M-Pesa</span>
          <Link href="/track" className="ml-auto hover:text-white">Track an order</Link>
        </div>
      </div>

      <div className="border-b border-line">
        <div className="container-page flex h-16 items-center gap-3 md:h-[72px] md:gap-6">
          <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" onClick={() => setMenu(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label={`${shopName} home`}>
            <LogoMark className="h-9 w-9 shrink-0" />
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-display text-[19px] font-extrabold tracking-tight text-ink-900">{shopName}</span>
              <span className="hidden truncate text-[12px] text-text-3 sm:block">{tagline}</span>
            </span>
          </Link>
          <Suspense fallback={<div className="hidden flex-1 md:block" />}>
            <SearchBox id="search-desktop" className="mx-auto hidden max-w-xl flex-1 md:flex" />
          </Suspense>
          <nav aria-label="Account and cart" className="ml-auto flex items-center gap-1 md:ml-0">
            <Link href="/track" className="hidden h-10 items-center gap-2 rounded-sm px-3 text-sm font-semibold text-text-2 hover:bg-sunken hover:text-text sm:flex">
              <PackageSearch className="h-5 w-5" aria-hidden /> <span className="hidden lg:inline">Track order</span>
            </Link>
            <Link href="/cart" className="relative flex h-10 items-center gap-2 rounded-sm px-2.5 text-sm font-semibold hover:bg-sunken sm:px-3"
              aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}>
              <ShoppingBag className="h-5 w-5" aria-hidden />
              <span className="hidden lg:inline">Cart</span>
              {count > 0 && (
                <span className="num absolute -right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-marigold-500 px-1 text-[11px] font-bold text-ink-950 lg:static lg:h-5 lg:min-w-5">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          </nav>
        </div>
        <div className="container-page pb-3 md:hidden">
          <Suspense fallback={<div className="h-11" />}><SearchBox id="search-mobile" /></Suspense>
        </div>
      </div>

      {/* Category bar */}
      <nav aria-label="Categories" className="hidden bg-ink-800 lg:block">
        <ul className="container-page flex h-11 items-center gap-1 text-[13px] font-semibold text-white/85">
          <li><Link href="/products" className={cx("flex h-11 items-center px-3 hover:bg-white/10 hover:text-white", pathname === "/products" && "bg-white/10 text-white")}>All products</Link></li>
          {cats.map((c) => {
            const active = pathname === `/category/${c.slug}`;
            return (
              <li key={c.id}>
                <Link href={`/category/${c.slug}`} aria-current={active ? "page" : undefined}
                  className={cx("flex h-11 items-center whitespace-nowrap px-3 hover:bg-white/10 hover:text-white", active && "bg-white/10 text-white shadow-[inset_0_-3px_0_#f2b13a]")}>
                  {c.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="shelf-edge" aria-hidden />

      <Drawer open={menu} onClose={() => setMenu(false)} side="left" title="Shop by category" width="max-w-xs">
        <ul className="py-2">
          <li>
            <Link href="/products" className="flex items-center gap-3 px-5 py-3 font-semibold hover:bg-sunken">
              <Icon name="Boxes" className="h-5 w-5 text-brand-600" /> All products <ChevronRight className="ml-auto h-4 w-4 text-text-3" aria-hidden />
            </Link>
          </li>
          {cats.map((c) => (
            <li key={c.id}>
              <Link href={`/category/${c.slug}`} className="flex items-center gap-3 px-5 py-3 hover:bg-sunken">
                <Icon name={c.icon} className="h-5 w-5 text-brand-600" /> {c.name}
                <ChevronRight className="ml-auto h-4 w-4 text-text-3" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
        <div className="border-t border-line px-5 py-4">
          <Link href="/track" className="flex items-center gap-3 py-2 font-semibold"><PackageSearch className="h-5 w-5 text-brand-600" aria-hidden /> Track an order</Link>
        </div>
      </Drawer>
    </header>
  );
}

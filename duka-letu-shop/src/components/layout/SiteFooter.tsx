"use client";

import Link from "next/link";
import { Clock, MapPin, Phone, Lock } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import { LogoMark } from "../shared/bits";

export function SiteFooter() {
  const snap = useApp();
  const s = snap?.data.settings;
  const cats = snap?.data.categories ?? [];
  return (
    <footer className="mt-16 bg-ink-900 text-white/75 print:hidden">
      <div className="shelf-edge" aria-hidden />
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-9 w-9" inverse />
            <span className="font-display text-xl font-extrabold text-white">{s?.shopName ?? "Duka Letu"}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm">
            Lighting, torches, audio, power, tools and home goods from our shop to your door. Order online, pay with M-Pesa.
          </p>
        </div>
        <div>
          <h2 className="font-sans text-[13px] font-bold uppercase tracking-wider text-white">Shop</h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-1">
            {cats.slice(0, 6).map((c) => <li key={c.id}><Link href={`/category/${c.slug}`} className="hover:text-white">{c.name}</Link></li>)}
            <li><Link href="/products" className="hover:text-white">All products</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-sans text-[13px] font-bold uppercase tracking-wider text-white">Help</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/track" className="hover:text-white">Track an order</Link></li>
            <li><Link href="/cart" className="hover:text-white">Your cart</Link></li>
            <li><Link href="/#delivery" className="hover:text-white">Delivery & pickup</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-sans text-[13px] font-bold uppercase tracking-wider text-white">Visit us</h2>
          <ul className="mt-3 space-y-2.5 text-sm">
            <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-marigold-500" aria-hidden />{s?.address}</li>
            <li className="flex gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-marigold-500" aria-hidden />{s?.hours}</li>
            <li className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-marigold-500" aria-hidden />{s?.phone}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-wrap items-center gap-x-6 gap-y-2 py-4 text-[12px] text-white/55">
          <span>© {new Date().getFullYear()} {s?.shopName ?? "Duka Letu"}. Prices in Kenyan shillings (KES).</span>
          <Link href="/staff/login" className="ml-auto flex items-center gap-1 hover:text-white">
            <Lock className="h-3 w-3" aria-hidden /> Staff login
          </Link>
        </div>
      </div>
    </footer>
  );
}

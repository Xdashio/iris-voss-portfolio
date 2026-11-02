"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ShoppingBag, Trash2, ArrowRight, TriangleAlert, ArrowLeft } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import { cartRows } from "@/lib/calculations";
import { removeFromCart, setCartQty } from "@/lib/actions";
import { money } from "@/lib/format";
import { ProductImage } from "../shared/ProductImage";
import { Price } from "../shared/bits";
import { Button, EmptyState, QtyStepper, Skeleton } from "../shared/ui";

export function CartPage() {
  const snap = useApp();

  // If stock dropped below what's in the cart (e.g. a shop sale), lower the quantity.
  useEffect(() => {
    if (!snap) return;
    cartRows(snap.data, snap.cart).forEach((r) => {
      if (!r.unavailable && r.overStock) setCartQty(r.product.id, r.variant.id, r.variant.stock);
    });
  }, [snap]);

  if (!snap) {
    return <div className="container-page pt-8"><Skeleton className="mb-6 h-9 w-40" /><div className="grid gap-6 lg:grid-cols-[1fr_360px]"><Skeleton className="h-64" /><Skeleton className="h-56" /></div></div>;
  }

  const rows = cartRows(snap.data, snap.cart);
  const subtotal = rows.filter((r) => !r.unavailable).reduce((s, r) => s + r.variant.price * Math.min(r.line.qty, r.variant.stock), 0);
  const items = rows.reduce((s, r) => s + r.line.qty, 0);
  const problems = rows.filter((r) => r.unavailable || r.overStock);
  const minFee = Math.min(...snap.data.settings.zones.map((z) => z.fee));

  if (rows.length === 0) {
    return (
      <div className="container-page">
        <h1 className="sr-only">Your cart</h1>
        <EmptyState icon={<ShoppingBag />} title="Your cart is empty" body="Browse the shop and add a few things. Your cart is saved on this device."
          action={<Link href="/products" className="inline-flex h-11 items-center gap-2 rounded-sm bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700">Start shopping <ArrowRight className="h-4 w-4" aria-hidden /></Link>} />
      </div>
    );
  }

  return (
    <div className="container-page pt-6 md:pt-8">
      <h1 className="text-[28px] sm:text-[34px]">Your cart</h1>
      <p className="mt-1 text-sm text-text-2">{items} {items === 1 ? "item" : "items"}</p>

      {problems.length > 0 && (
        <div role="alert" className="mt-5 flex gap-3 rounded-md border border-warning-100 bg-warning-100/60 p-4 text-sm">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning-600" aria-hidden />
          <div>
            <p className="font-semibold">Stock changed since you added some items</p>
            <p className="text-text-2">Adjust the highlighted items before checking out.</p>
          </div>
        </div>
      )}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">
        <ul className="divide-y divide-line rounded-md border border-line bg-surface">
          {rows.map(({ line, product, variant, unavailable, overStock }) => (
            <li key={`${line.productId}-${line.variantId}`} className="flex gap-3 p-3 sm:gap-4 sm:p-4">
              <Link href={`/product/${product.slug}`} className="shrink-0">
                <ProductImage src={product.images[0]} alt={product.name} className="h-20 w-20 rounded-sm sm:h-24 sm:w-24" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/product/${product.slug}`} className="line-clamp-2 text-[15px] font-semibold hover:text-brand-700">{product.name}</Link>
                    <p className="text-[13px] text-text-2">{variant.label} · <span className="num">{money(variant.price)}</span> each</p>
                  </div>
                  <Price value={variant.price * line.qty} className="hidden sm:block" />
                </div>
                {unavailable ? (
                  <p className="mt-2 text-[13px] font-semibold text-danger-600">No longer available. Please remove it.</p>
                ) : overStock ? (
                  <p className="mt-2 text-[13px] font-semibold text-warning-600">Only {variant.stock} left, so we lowered your quantity.</p>
                ) : null}
                <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                  {unavailable ? <span /> : (
                    <QtyStepper size="sm" value={Math.min(line.qty, variant.stock)} max={variant.stock}
                      onChange={(n) => setCartQty(product.id, variant.id, n)} label={`Quantity of ${product.name}`} />
                  )}
                  <div className="flex items-center gap-2">
                    <Price value={variant.price * line.qty} size="sm" className="sm:hidden" />
                    <Button variant="ghost" size="sm" onClick={() => removeFromCart(product.id, variant.id)} aria-label={`Remove ${product.name} from cart`} className="text-text-2">
                      <Trash2 className="h-4 w-4" aria-hidden /><span className="hidden sm:inline">Remove</span>
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="rounded-md border border-line bg-surface p-5 lg:sticky lg:top-40" aria-labelledby="sum-title">
          <h2 id="sum-title" className="text-lg">Order summary</h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between"><dt className="text-text-2">Subtotal</dt><dd className="num font-semibold">{money(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-text-2">Delivery</dt><dd className="text-text-2">Free pickup, or from {money(minFee)}</dd></div>
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
            <span className="font-semibold">Total so far</span><Price value={subtotal} size="lg" />
          </div>
          {problems.some((p) => p.unavailable) ? (
            <Button size="lg" block className="mt-5" disabled>Remove unavailable items to continue</Button>
          ) : (
            <Link href="/checkout" className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-marigold-500 text-[15px] font-bold text-ink-950 hover:bg-marigold-600">
              Proceed to checkout <ArrowRight className="h-4.5 w-4.5" aria-hidden />
            </Link>
          )}
          <Link href="/products" className="mt-3 flex items-center justify-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}

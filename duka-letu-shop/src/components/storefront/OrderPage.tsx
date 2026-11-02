"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CircleCheck, Clock, MessageCircle, PackageSearch, SearchX, Store, Truck, Copy } from "lucide-react";
import type { Order, Settings } from "@/types";
import { useApp } from "@/hooks/useApp";
import { PAYMENT_LABEL } from "@/lib/orders";
import { fmtDateTime, fmtPhone, money } from "@/lib/format";
import { ProductImage } from "../shared/ProductImage";
import { OrderTracker, PaymentBadge, StatusBadge, StatusHistory } from "../shared/OrderBits";
import { Price } from "../shared/bits";
import { Button, EmptyState, Skeleton } from "../shared/ui";
import { useToast } from "../shared/toast";
import { MpesaDialog } from "./MpesaDialog";

export function whatsappLink(o: Order, s: Settings) {
  const lines = [
    `Hello ${s.shopName}, I'd like to confirm my order ${o.number}.`,
    ...o.items.map((i) => `• ${i.qty} × ${i.name} (${i.variantLabel})`),
    `Total: ${money(o.total)} · ${o.fulfilment === "pickup" ? "Pickup" : `Delivery, ${o.zoneName}`}`,
    `Name: ${o.customer.name}`,
  ];
  return `https://wa.me/${s.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function nextSteps(o: Order): string {
  if (o.status === "cancelled") return "This order was cancelled. Any stock held for it has been returned to the shelf.";
  if (o.paymentStatus === "pending" || o.paymentStatus === "failed") return "Complete the M-Pesa payment so we can start packing your order.";
  if (o.status === "placed") return o.fulfilment === "pickup" ? "We’re preparing your order. We’ll mark it ready for pickup once it’s packed." : "We’re preparing your order for delivery.";
  if (o.status === "packed") return o.fulfilment === "pickup" ? "Packed! It will be ready at the counter shortly." : "Packed and waiting for the rider.";
  if (o.status === "ready_for_pickup") return `Ready at the counter. Bring your order number ${o.number}${o.paymentStatus === "unpaid" ? " and pay when you collect" : ""}.`;
  if (o.status === "out_for_delivery") return "Our rider is on the way. Keep your phone nearby.";
  return "Done. Thank you for shopping with us!";
}

export function OrderDetailView({ order: o, settings, showConfirmHero }: { order: Order; settings: Settings; showConfirmHero?: boolean }) {
  const { toast } = useToast();
  const [pay, setPay] = useState(false);
  const sp = useSearchParams();
  const router = useRouter();
  const canPay = o.paymentMethod !== "cash" && (o.paymentStatus === "pending" || o.paymentStatus === "failed") && o.status !== "cancelled";

  useEffect(() => {
    if (sp.get("pay") === "1" && canPay) setPay(true);
    if (sp.get("pay")) router.replace(`/order/${o.id}`, { scroll: false });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-4xl">
      {showConfirmHero && (
        <div className="mb-6 flex flex-col items-start gap-4 rounded-md bg-ink-900 p-5 text-white sm:flex-row sm:items-center sm:p-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-success-600"><CircleCheck className="h-6 w-6" aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <h1 className="text-[24px] sm:text-[28px]">Thank you, {o.customer.name.split(" ")[0]}!</h1>
            <p className="mt-1 text-white/75">Your order has been received. Save your order number to track it.</p>
          </div>
          <div className="rounded-sm bg-white/10 px-4 py-2.5 text-center">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-white/60">Order number</span>
            <span className="num font-display text-[24px] font-bold text-marigold-500">{o.number}</span>
            <button onClick={() => { navigator.clipboard?.writeText(o.number).then(() => toast({ kind: "success", title: "Order number copied" }), () => {}); }}
              className="mx-auto mt-0.5 flex items-center gap-1 text-[12px] text-white/70 hover:text-white"><Copy className="h-3 w-3" aria-hidden /> Copy</button>
          </div>
        </div>
      )}

      {canPay && (
        <div role="alert" className="mb-6 flex flex-col gap-3 rounded-md border border-warning-100 bg-warning-100/70 p-4 sm:flex-row sm:items-center">
          <Clock className="h-5 w-5 shrink-0 text-warning-600" aria-hidden />
          <div className="flex-1 text-sm">
            <p className="font-semibold">{o.paymentStatus === "failed" ? "Payment didn’t go through" : "Awaiting M-Pesa payment"}</p>
            <p className="text-text-2">Pay {money(o.total)} via {PAYMENT_LABEL[o.paymentMethod]} to confirm your order.</p>
          </div>
          <Button variant="success" onClick={() => setPay(true)}>Pay {money(o.total)} now</Button>
        </div>
      )}

      <section className="rounded-md border border-line bg-surface p-5 sm:p-6" aria-labelledby="prog">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <h2 id="prog" className="mr-auto text-lg">{showConfirmHero ? "Order progress" : `Order ${o.number}`}</h2>
          <StatusBadge status={o.status} />
          <PaymentBadge status={o.paymentStatus} />
        </div>
        <OrderTracker order={o} />
        <p className="mt-6 rounded-sm bg-canvas px-4 py-3 text-sm"><b>Next: </b>{nextSteps(o)}</p>
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="rounded-md border border-line bg-surface" aria-labelledby="items">
          <h2 id="items" className="border-b border-line px-5 py-4 text-lg">Items</h2>
          <ul className="divide-y divide-line px-5">
            {o.items.map((i) => (
              <li key={i.variantId} className="flex gap-3 py-3">
                <ProductImage src={i.image} alt="" className="h-14 w-14 shrink-0 rounded-sm" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="line-clamp-2 font-semibold">{i.name}</p>
                  <p className="num text-[13px] text-text-2">{i.variantLabel} · {i.qty} × {money(i.unitPrice)}</p>
                </div>
                <span className="num text-sm font-semibold">{money(i.qty * i.unitPrice)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-line px-5 py-4 text-sm">
            <div className="flex justify-between"><dt className="text-text-2">Subtotal</dt><dd className="num">{money(o.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-text-2">{o.fulfilment === "pickup" ? "Pickup" : `Delivery · ${o.zoneName}`}</dt><dd className="num">{o.deliveryFee ? money(o.deliveryFee) : "Free"}</dd></div>
            <div className="flex items-baseline justify-between border-t border-line pt-3"><dt className="font-bold">Total</dt><dd><Price value={o.total} size="lg" /></dd></div>
          </dl>
        </section>

        <div className="space-y-6">
          <section className="rounded-md border border-line bg-surface p-5 text-sm" aria-labelledby="det">
            <h2 id="det" className="text-lg">Details</h2>
            <dl className="mt-3 space-y-3">
              <div><dt className="text-[12px] font-semibold uppercase tracking-wider text-text-3">Customer</dt><dd>{o.customer.name}<br /><span className="num">{fmtPhone(o.customer.phone)}</span>{o.customer.email && <><br />{o.customer.email}</>}</dd></div>
              <div><dt className="text-[12px] font-semibold uppercase tracking-wider text-text-3">{o.fulfilment === "pickup" ? "Pickup" : "Delivery"}</dt>
                <dd className="flex gap-2">{o.fulfilment === "pickup" ? <Store className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden /> : <Truck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />}
                  <span>{o.fulfilment === "pickup" ? <>{settings.address}<br />{settings.hours}</> : <>{o.zoneName}{o.deliveryNote && <><br /><span className="text-text-2">“{o.deliveryNote}”</span></>}</>}</span></dd></div>
              <div><dt className="text-[12px] font-semibold uppercase tracking-wider text-text-3">Payment</dt>
                <dd>{PAYMENT_LABEL[o.paymentMethod]}{o.paymentRef && o.paymentRef !== "CASH" && <span className="num block text-text-2">Ref {o.paymentRef}</span>}</dd></div>
              <div><dt className="text-[12px] font-semibold uppercase tracking-wider text-text-3">Placed</dt><dd className="num">{fmtDateTime(o.createdAt)}</dd></div>
            </dl>
          </section>

          <section className="rounded-md border border-line bg-surface p-5" aria-labelledby="hist">
            <h2 id="hist" className="mb-3 text-lg">Status history</h2>
            <StatusHistory order={o} />
          </section>

          {settings.whatsapp && o.status !== "cancelled" && (
            <a href={whatsappLink(o, settings)} target="_blank" rel="noopener noreferrer"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-sm border border-[#1da851] text-sm font-semibold text-[#128c42] hover:bg-[#1da851]/10">
              <MessageCircle className="h-4.5 w-4.5" aria-hidden /> Confirm on WhatsApp (optional)
            </a>
          )}
        </div>
      </div>

      <MpesaDialog order={o} settings={settings} open={pay} onClose={() => setPay(false)} />
    </div>
  );
}

export function OrderPage({ id }: { id: string }) {
  const snap = useApp();
  if (!snap) return <div className="container-page pt-8"><div className="mx-auto max-w-4xl space-y-6"><Skeleton className="h-28" /><Skeleton className="h-40" /><Skeleton className="h-64" /></div></div>;
  const order = snap.data.orders.find((o) => o.id === id);
  if (!order) {
    return (
      <div className="container-page">
        <h1 className="sr-only">Order not found</h1>
        <EmptyState icon={<SearchX />} title="We couldn’t find that order" body="The link may be incomplete. Look it up with your order number and phone instead."
          action={<Link href="/track" className="inline-flex h-10 items-center gap-2 rounded-sm bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"><PackageSearch className="h-4 w-4" aria-hidden /> Track an order</Link>} />
      </div>
    );
  }
  return (
    <div className="container-page pt-6 md:pt-8">
      <OrderDetailView order={order} settings={snap.data.settings} showConfirmHero />
      <p className="mx-auto mt-6 max-w-4xl text-center text-sm text-text-2">
        Bookmark this page, or track any time at <Link href="/track" className="font-semibold text-brand-600 underline underline-offset-2">Track an order</Link> with <b className="num">{order.number}</b> and your phone number.
      </p>
    </div>
  );
}

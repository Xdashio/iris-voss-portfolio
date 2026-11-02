"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { ClipboardList, Search, Store, Truck, Phone, Banknote, Smartphone, Ban, ArrowRight, MessageCircle } from "lucide-react";
import type { Order } from "@/types";
import { useStaff } from "@/hooks/useApp";
import { advanceOrder, cancelOrder, recordOrderPayment } from "@/lib/actions";
import { NEXT_ACTION_LABEL, PAYMENT_LABEL, isFinal, nextStatus } from "@/lib/orders";
import { fmtDateTime, fmtPhone, money, plural, timeAgo } from "@/lib/format";
import { can } from "@/lib/permissions";
import { useToast } from "../shared/toast";
import { ProductImage } from "../shared/ProductImage";
import { OrderTracker, PaymentBadge, StatusBadge, StatusHistory } from "../shared/OrderBits";
import { Button, ConfirmDialog, Drawer, EmptyState, Field, Input, Segmented, Select, Skeleton, Textarea } from "../shared/ui";
import { PageHeader } from "./StaffShell";

type Tab = "new" | "active" | "done" | "cancelled" | "all";

function matchTab(o: Order, t: Tab) {
  if (t === "all") return true;
  if (t === "new") return o.status === "placed";
  if (t === "active") return !isFinal(o.status) && o.status !== "placed";
  if (t === "done") return o.status === "delivered" || o.status === "collected";
  return o.status === "cancelled";
}

function OrderDrawer({ order: o, onClose }: { order: Order; onClose: () => void }) {
  const { snap, staff } = useStaff();
  const { attempt } = useToast();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [code, setCode] = useState("");
  const manage = can(staff, "orders.manage");
  const next = nextStatus(o);
  const needsPayment = o.paymentStatus !== "paid" && o.status !== "cancelled";
  const blockedByPayment = next && (next === "collected" || next === "delivered") && o.paymentStatus !== "paid";
  const wa = snap?.data.settings.whatsapp;

  return (
    <Drawer open onClose={onClose} title={<span className="num">Order {o.number}</span>} width="max-w-xl"
      footer={manage && !isFinal(o.status) ? (
        <div className="flex flex-wrap gap-2">
          {next && (
            <Button size="lg" className="flex-1" disabled={!!blockedByPayment}
              onClick={() => attempt(() => advanceOrder(o.id, next), (r) => `${r.number}: ${NEXT_ACTION_LABEL[next]?.replace("Mark ", "").replace("Send out for delivery", "out for delivery")}`)}>
              {NEXT_ACTION_LABEL[next]} <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          )}
          <Button size="lg" variant="outline" onClick={() => setCancelOpen(true)}><Ban className="h-4 w-4" aria-hidden /> Cancel order</Button>
          {blockedByPayment && <p className="w-full text-[13px] text-warning-600">Record payment before marking this order {next === "collected" ? "collected" : "delivered"}.</p>}
        </div>
      ) : undefined}>
      <div className="space-y-6 px-5 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={o.status} /><PaymentBadge status={o.paymentStatus} />
          <span className="ml-auto text-[13px] text-text-3">Placed {fmtDateTime(o.createdAt)}</span>
        </div>
        <OrderTracker order={o} compact />

        {needsPayment && manage && (
          <section className="rounded-md border border-warning-100 bg-warning-100/50 p-4" aria-labelledby="pay-t">
            <h3 id="pay-t" className="flex items-center gap-2 font-sans text-sm font-bold">
              {o.paymentMethod === "cash" ? <Banknote className="h-4 w-4" aria-hidden /> : <Smartphone className="h-4 w-4" aria-hidden />}
              {o.paymentMethod === "cash" ? `Collect ${money(o.total)} cash at pickup` : `M-Pesa ${o.paymentStatus === "failed" ? "payment failed" : "not yet confirmed"}`}
            </h3>
            {o.paymentMethod === "cash" ? (
              <Button variant="success" className="mt-3" onClick={() => attempt(() => recordOrderPayment(o.id), `Cash recorded for ${o.number}`)}>Mark cash received</Button>
            ) : (
              <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (attempt(() => recordOrderPayment(o.id, code), `Payment recorded for ${o.number}`)) setCode(""); }}>
                <Field label="M-Pesa confirmation code" htmlFor="ord-code" hint="Check the shop’s M-Pesa statement, then enter the code." className="min-w-0 flex-1">
                  <Input id="ord-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 10))} placeholder="e.g. SKL4XT9Q2M" className="num uppercase" aria-describedby="ord-code-hint" />
                </Field>
                <Button type="submit" variant="success">Confirm payment</Button>
              </form>
            )}
          </section>
        )}

        <section aria-labelledby="cust-t">
          <h3 id="cust-t" className="mb-2 text-[12px] font-bold uppercase tracking-wider text-text-3">Customer</h3>
          <div className="rounded-md border border-line p-4 text-sm">
            <p className="font-semibold">{o.customer.name}</p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-text-2">
              <a href={`tel:+${o.customer.phone}`} className="num flex items-center gap-1.5 hover:text-brand-700"><Phone className="h-3.5 w-3.5" aria-hidden />{fmtPhone(o.customer.phone)}</a>
              {wa && <a href={`https://wa.me/${o.customer.phone}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-brand-700"><MessageCircle className="h-3.5 w-3.5" aria-hidden />WhatsApp</a>}
              {o.customer.email && <span>{o.customer.email}</span>}
            </div>
            <p className="mt-3 flex items-start gap-2 border-t border-line pt-3">
              {o.fulfilment === "pickup" ? <Store className="mt-0.5 h-4 w-4 text-brand-600" aria-hidden /> : <Truck className="mt-0.5 h-4 w-4 text-brand-600" aria-hidden />}
              <span>{o.fulfilment === "pickup" ? "Shop pickup" : <>Delivery · {o.zoneName} ({money(o.deliveryFee)}){o.deliveryNote && <span className="block text-text-2">“{o.deliveryNote}”</span>}</>}</span>
            </p>
            <p className="mt-2 text-text-2">{PAYMENT_LABEL[o.paymentMethod]}{o.paymentRef && o.paymentRef !== "CASH" && <span className="num"> · Ref {o.paymentRef}</span>}</p>
          </div>
        </section>

        <section aria-labelledby="it-t">
          <h3 id="it-t" className="mb-2 text-[12px] font-bold uppercase tracking-wider text-text-3">Items to pack</h3>
          <ul className="divide-y divide-line rounded-md border border-line">
            {o.items.map((i) => (
              <li key={i.variantId} className="flex items-center gap-3 p-3 text-sm">
                <ProductImage src={i.image} alt="" className="h-11 w-11 shrink-0 rounded-sm" />
                <div className="min-w-0 flex-1"><p className="truncate font-semibold">{i.name}</p><p className="num text-[12px] text-text-3">{i.variantLabel} · {i.sku}</p></div>
                <span className="num text-right"><b>× {i.qty}</b><span className="block text-[12px] text-text-3">{money(i.unitPrice * i.qty)}</span></span>
              </li>
            ))}
            <li className="flex justify-between p-3 text-sm"><span className="font-semibold">Total</span><span className="num font-display text-base font-bold">{money(o.total)}</span></li>
          </ul>
        </section>

        <section aria-labelledby="h-t">
          <h3 id="h-t" className="mb-3 text-[12px] font-bold uppercase tracking-wider text-text-3">History</h3>
          <StatusHistory order={o} />
        </section>
      </div>

      <ConfirmDialog open={cancelOpen} onClose={() => setCancelOpen(false)} title={`Cancel ${o.number}?`} confirmLabel="Cancel order"
        body={<>The {o.items.reduce((a, i) => a + i.qty, 0)} item(s) go back into stock.{o.paymentStatus === "paid" && <> The payment will be marked <b>refunded</b>. Refund the customer via M-Pesa separately.</>}</>}
        onConfirm={() => { if (attempt(() => cancelOrder(o.id, reason), `${o.number} cancelled, stock restored`)) { setCancelOpen(false); setReason(""); } }}>
        <Field label="Reason" htmlFor="c-reason" className="mt-4">
          <Textarea id="c-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Customer changed their mind" className="min-h-0" />
        </Field>
      </ConfirmDialog>
    </Drawer>
  );
}

function OrdersInner() {
  const { snap } = useStaff();
  const sp = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("new");
  const [q, setQ] = useState("");
  const [ful, setFul] = useState<"" | "pickup" | "delivery">("");
  const openId = sp.get("open");
  const orders = snap?.data.orders;

  const counts = useMemo(() => {
    const c = { new: 0, active: 0, done: 0, cancelled: 0, all: 0 } as Record<Tab, number>;
    orders?.forEach((o) => (["new", "active", "done", "cancelled", "all"] as Tab[]).forEach((t) => { if (matchTab(o, t)) c[t]++; }));
    return c;
  }, [orders]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase().replace(/\s/g, "");
    return (orders ?? []).filter((o) => matchTab(o, tab) && (!ful || o.fulfilment === ful)
      && (!term || o.number.toLowerCase().includes(term) || o.customer.name.toLowerCase().replace(/\s/g, "").includes(term) || o.customer.phone.includes(term.replace(/^0/, ""))));
  }, [orders, tab, q, ful]);

  if (!snap) return <><Skeleton className="mb-6 h-9 w-40" /><Skeleton className="h-96 rounded-md" /></>;
  const open = openId ? snap.data.orders.find((o) => o.id === openId) : undefined;
  const setOpen = (id: string | null) => router.replace(id ? `/staff/orders?open=${id}` : "/staff/orders", { scroll: false });

  return (
    <div>
      <PageHeader title="Orders" sub="Online orders from the website. Work them from New to Collected or Delivered." />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <Segmented label="Order status" value={tab} onChange={setTab} options={[
          { value: "new", label: "New", count: counts.new }, { value: "active", label: "In progress", count: counts.active },
          { value: "done", label: "Completed", count: counts.done }, { value: "cancelled", label: "Cancelled", count: counts.cancelled }, { value: "all", label: "All", count: counts.all },
        ]} />
        <div className="flex gap-2 lg:ml-auto">
          <div className="relative flex-1 lg:w-64">
            <label htmlFor="o-q" className="sr-only">Search orders</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" aria-hidden />
            <Input id="o-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order no., name or phone" className="pl-9" />
          </div>
          <label htmlFor="o-ful" className="sr-only">Fulfilment</label>
          <Select id="o-ful" value={ful} onChange={(e) => setFul(e.target.value as typeof ful)} className="w-36">
            <option value="">All methods</option><option value="pickup">Pickup</option><option value="delivery">Delivery</option>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-surface">
        {list.length === 0 ? (
          <EmptyState icon={<ClipboardList />} title={tab === "new" && !q ? "No new orders" : "No orders match"} body={tab === "new" && !q ? "New website orders will appear here." : "Try another tab or search."} />
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full text-sm md:table">
              <thead className="border-b border-line bg-canvas text-left text-[12px] uppercase tracking-wider text-text-3">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Order</th><th className="px-4 py-2.5 font-semibold">Customer</th><th className="px-4 py-2.5 font-semibold">Method</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th><th className="px-4 py-2.5 font-semibold">Payment</th><th className="px-4 py-2.5 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.map((o) => (
                  <tr key={o.id} className="cursor-pointer hover:bg-canvas" onClick={() => setOpen(o.id)}>
                    <td className="px-4 py-3">
                      <button className="num font-bold text-brand-700 hover:underline" onClick={(e) => { e.stopPropagation(); setOpen(o.id); }}>{o.number}</button>
                      <span className="block text-[12px] text-text-3">{timeAgo(o.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3"><span className="font-medium">{o.customer.name}</span><span className="num block text-[12px] text-text-3">{fmtPhone(o.customer.phone)}</span></td>
                    <td className="px-4 py-3">{o.fulfilment === "pickup" ? "Pickup" : `Delivery · ${o.zoneName}`}<span className="block text-[12px] text-text-3">{plural(o.items.reduce((a, i) => a + i.qty, 0), "item")}</span></td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3"><PaymentBadge status={o.paymentStatus} /><span className="block text-[12px] text-text-3">{PAYMENT_LABEL[o.paymentMethod]}</span></td>
                    <td className="num px-4 py-3 text-right font-semibold">{money(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Mobile cards */}
            <ul className="divide-y divide-line md:hidden">
              {list.map((o) => (
                <li key={o.id}>
                  <button onClick={() => setOpen(o.id)} className="w-full px-4 py-3 text-left hover:bg-canvas">
                    <span className="flex items-center justify-between gap-2"><span className="num font-bold text-brand-700">{o.number}</span><span className="num font-semibold">{money(o.total)}</span></span>
                    <span className="mt-0.5 block text-sm">{o.customer.name} <span className="text-text-3">· {o.fulfilment === "pickup" ? "Pickup" : "Delivery"} · {timeAgo(o.createdAt)}</span></span>
                    <span className="mt-2 flex flex-wrap gap-1.5"><StatusBadge status={o.status} /><PaymentBadge status={o.paymentStatus} /></span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      {open && <OrderDrawer order={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

export function OrdersPage() {
  return <Suspense><OrdersInner /></Suspense>;
}

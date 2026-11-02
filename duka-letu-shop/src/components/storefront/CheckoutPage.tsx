"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Store, Truck, Smartphone, Banknote, ShoppingBag, Lock, ArrowLeft } from "lucide-react";
import type { Fulfilment, PaymentMethod } from "@/types";
import { useApp } from "@/hooks/useApp";
import { cartRows } from "@/lib/calculations";
import { placeOrder, DomainError } from "@/lib/actions";
import { money } from "@/lib/format";
import { isEmail, normalizeKePhone } from "@/lib/validation";
import { useToast } from "../shared/toast";
import { ProductImage } from "../shared/ProductImage";
import { Price } from "../shared/bits";
import { Button, EmptyState, Field, Input, Skeleton, Textarea, cx } from "../shared/ui";

type Errors = Partial<Record<"name" | "phone" | "email" | "zone" | "payment", string>>;

function OptionCard({ name, value, checked, onChange, icon, title, desc, aside, disabled }: {
  name: string; value: string; checked: boolean; onChange: () => void; icon: React.ReactNode; title: string; desc: React.ReactNode; aside?: React.ReactNode; disabled?: boolean;
}) {
  const id = `${name}-${value}`;
  return (
    <label htmlFor={id} className={cx(
      "flex cursor-pointer items-start gap-3 rounded-md border bg-surface p-4 transition-colors",
      checked ? "border-brand-600 ring-1 ring-brand-600" : "border-line-strong hover:border-ink-700",
      disabled && "cursor-not-allowed opacity-50 hover:border-line-strong",
    )}>
      <input id={id} type="radio" name={name} value={value} checked={checked} onChange={onChange} disabled={disabled} className="mt-1 h-4 w-4 shrink-0 accent-brand-600" />
      <span className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", checked ? "bg-brand-600 text-white" : "bg-sunken text-text-2")} aria-hidden>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2"><span className="font-semibold">{title}</span>{aside}</span>
        <span className="mt-0.5 block text-[13px] text-text-2">{desc}</span>
      </span>
    </label>
  );
}

export function CheckoutPage() {
  const snap = useApp();
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [fulfilment, setFulfilment] = useState<Fulfilment>("pickup");
  const [zoneId, setZoneId] = useState<string>("");
  const [note, setNote] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("mpesa_till");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const placed = useRef(false);

  // Cash is pickup-only.
  useEffect(() => { if (fulfilment === "delivery" && payment === "cash") setPayment("mpesa_till"); }, [fulfilment, payment]);

  if (!snap) return <div className="container-page pt-8"><Skeleton className="mb-6 h-9 w-48" /><div className="grid gap-6 lg:grid-cols-[1fr_380px]"><Skeleton className="h-[480px]" /><Skeleton className="h-72" /></div></div>;

  const { settings } = snap.data;
  const rows = cartRows(snap.data, snap.cart).filter((r) => !r.unavailable);
  if (rows.length === 0 && !placed.current) {
    return (
      <div className="container-page">
        <h1 className="sr-only">Checkout</h1>
        <EmptyState icon={<ShoppingBag />} title="Nothing to check out" body="Your cart is empty. Add something first."
          action={<Link href="/products" className="inline-flex h-10 items-center rounded-sm bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700">Browse products</Link>} />
      </div>
    );
  }

  const zone = settings.zones.find((z) => z.id === zoneId);
  const subtotal = rows.reduce((s, r) => s + r.variant.price * Math.min(r.line.qty, r.variant.stock), 0);
  const fee = fulfilment === "delivery" ? zone?.fee ?? 0 : 0;
  const total = subtotal + fee;

  const validate = (): Errors => {
    const e: Errors = {};
    if (name.trim().length < 2) e.name = "Enter your full name.";
    if (!normalizeKePhone(phone)) e.phone = "Enter a Kenyan mobile number, e.g. 0712 345 678.";
    if (email.trim() && !isEmail(email)) e.email = "That email address doesn't look right.";
    if (fulfilment === "delivery" && !zone) e.zone = "Choose your delivery zone.";
    return e;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (busy) return;
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0];
      document.getElementById(first === "zone" ? "zone-group" : `co-${first}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      const order = placeOrder({ name, phone, email, fulfilment, zoneId: zone?.id, deliveryNote: note, paymentMethod: payment });
      placed.current = true;
      router.push(`/order/${order.id}${payment === "cash" ? "" : "?pay=1"}`);
    } catch (err) {
      setBusy(false);
      toast({ kind: "error", title: err instanceof DomainError ? err.message : "Could not place your order. Please try again." });
    }
  };

  return (
    <div className="container-page pt-6 md:pt-8">
      <Link href="/cart" className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"><ArrowLeft className="h-4 w-4" aria-hidden /> Back to cart</Link>
      <h1 className="text-[28px] sm:text-[34px]">Checkout</h1>

      <form noValidate onSubmit={submit} className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
        <div className="space-y-6">
          <section className="rounded-md border border-line bg-surface p-5 sm:p-6" aria-labelledby="s1">
            <h2 id="s1" className="flex items-center gap-2.5 text-lg"><span className="num flex h-6 w-6 items-center justify-center rounded-full bg-ink-800 text-[12px] text-white">1</span> Your details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="co-name" error={errors.name} className="sm:col-span-2">
                <Input id="co-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} invalid={!!errors.name} aria-describedby={errors.name ? "co-name-err" : undefined} />
              </Field>
              <Field label="M-Pesa / phone number" htmlFor="co-phone" error={errors.phone} hint="We’ll use this to confirm your order and for M-Pesa.">
                <Input id="co-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "co-phone-err" : "co-phone-hint"} />
              </Field>
              <Field label="Email" optional htmlFor="co-email" error={errors.email} hint="For a copy of your receipt.">
                <Input id="co-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!errors.email}
                  aria-describedby={errors.email ? "co-email-err" : "co-email-hint"} />
              </Field>
            </div>
          </section>

          <section className="rounded-md border border-line bg-surface p-5 sm:p-6" aria-labelledby="s2">
            <h2 id="s2" className="flex items-center gap-2.5 text-lg"><span className="num flex h-6 w-6 items-center justify-center rounded-full bg-ink-800 text-[12px] text-white">2</span> Pickup or delivery</h2>
            <fieldset className="mt-5 grid gap-3 sm:grid-cols-2">
              <legend className="sr-only">Fulfilment method</legend>
              <OptionCard name="ful" value="pickup" checked={fulfilment === "pickup"} onChange={() => setFulfilment("pickup")} icon={<Store className="h-4.5 w-4.5" />}
                title="Pick up in shop" aside={<span className="text-sm font-bold text-success-600">Free</span>} desc={settings.hours} />
              <OptionCard name="ful" value="delivery" checked={fulfilment === "delivery"} onChange={() => setFulfilment("delivery")} icon={<Truck className="h-4.5 w-4.5" />}
                title="Deliver in town" aside={<span className="num text-sm font-semibold text-text-2">from {money(Math.min(...settings.zones.map((z) => z.fee)))}</span>} desc="Delivered by our rider. Fee depends on your zone." />
            </fieldset>

            {fulfilment === "delivery" && (
              <div className="anim-fade mt-5 space-y-4">
                <fieldset id="zone-group" tabIndex={-1} aria-describedby={errors.zone ? "zone-err" : undefined} className="focus:outline-none">
                  <legend className="mb-2 text-[13px] font-semibold">Delivery zone</legend>
                  <div className="divide-y divide-line overflow-hidden rounded-md border border-line-strong">
                    {settings.zones.map((z) => (
                      <label key={z.id} htmlFor={`zone-${z.id}`} className={cx("flex cursor-pointer items-center gap-3 px-4 py-3", zoneId === z.id ? "bg-brand-50" : "hover:bg-canvas")}>
                        <input id={`zone-${z.id}`} type="radio" name="zone" checked={zoneId === z.id} onChange={() => setZoneId(z.id)} className="h-4 w-4 accent-brand-600" />
                        <span className="flex-1"><span className="block text-sm font-semibold">{z.name}</span><span className="text-[13px] text-text-2">{z.areas}</span></span>
                        <span className="num text-sm font-bold">{money(z.fee)}</span>
                      </label>
                    ))}
                  </div>
                  {errors.zone && <p id="zone-err" role="alert" className="mt-1.5 text-[13px] text-danger-600">{errors.zone}</p>}
                </fieldset>
                <Field label="Directions for the rider" optional htmlFor="co-note" hint="Estate, building, landmark or gate colour.">
                  <Textarea id="co-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} aria-describedby="co-note-hint" className="min-h-0" />
                </Field>
              </div>
            )}
          </section>

          <section className="rounded-md border border-line bg-surface p-5 sm:p-6" aria-labelledby="s3">
            <h2 id="s3" className="flex items-center gap-2.5 text-lg"><span className="num flex h-6 w-6 items-center justify-center rounded-full bg-ink-800 text-[12px] text-white">3</span> Payment</h2>
            <fieldset className="mt-5 grid gap-3">
              <legend className="sr-only">Payment method</legend>
              <OptionCard name="pay" value="mpesa_till" checked={payment === "mpesa_till"} onChange={() => setPayment("mpesa_till")} icon={<Smartphone className="h-4.5 w-4.5" />}
                title="M-Pesa Till (Buy Goods)" desc={<>Till number <b className="num text-text">{settings.tillNumber}</b>. You’ll get a payment prompt on your phone.</>} />
              <OptionCard name="pay" value="mpesa_paybill" checked={payment === "mpesa_paybill"} onChange={() => setPayment("mpesa_paybill")} icon={<Smartphone className="h-4.5 w-4.5" />}
                title="M-Pesa Paybill" desc={<>Business no. <b className="num text-text">{settings.paybillNumber}</b>, account: {settings.paybillAccountFormat}.</>} />
              <OptionCard name="pay" value="cash" checked={payment === "cash"} onChange={() => setPayment("cash")} icon={<Banknote className="h-4.5 w-4.5" />} disabled={fulfilment === "delivery"}
                title="Cash on pickup" desc={fulfilment === "delivery" ? "Only available for shop pickup." : "Pay at the counter when you collect."} />
            </fieldset>
          </section>
        </div>

        <aside className="rounded-md border border-line bg-surface lg:sticky lg:top-40" aria-labelledby="sum">
          <h2 id="sum" className="border-b border-line px-5 py-4 text-lg">Order summary</h2>
          <ul className="max-h-72 divide-y divide-line overflow-y-auto px-5">
            {rows.map(({ product, variant, line }) => (
              <li key={variant.id} className="flex gap-3 py-3">
                <div className="relative shrink-0">
                  <ProductImage src={product.images[0]} alt="" className="h-14 w-14 rounded-sm" />
                  <span className="num absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink-800 px-1 text-[11px] font-bold text-white">{Math.min(line.qty, variant.stock)}</span>
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="line-clamp-2 font-semibold leading-snug">{product.name}</p>
                  <p className="text-[12px] text-text-3">{variant.label}</p>
                </div>
                <span className="num text-sm font-semibold">{money(variant.price * Math.min(line.qty, variant.stock))}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-line px-5 py-4 text-sm">
            <div className="flex justify-between"><dt className="text-text-2">Subtotal</dt><dd className="num font-semibold">{money(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-text-2">{fulfilment === "pickup" ? "Pickup" : `Delivery${zone ? ` · ${zone.name}` : ""}`}</dt>
              <dd className="num font-semibold">{fulfilment === "pickup" ? "Free" : zone ? money(zone.fee) : "Choose zone"}</dd></div>
          </dl>
          <div className="flex items-baseline justify-between border-t border-line px-5 py-4"><span className="font-bold">Total</span><Price value={total} size="xl" /></div>
          <div className="px-5 pb-5">
            <Button type="submit" size="lg" variant="accent" block loading={busy}>
              {payment === "cash" ? "Place order" : `Place order & pay ${money(total)}`}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-text-3"><Lock className="h-3 w-3" aria-hidden /> Your details are only used for this order.</p>
          </div>
        </aside>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { PackageSearch, SearchX } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import { normalizeKePhone } from "@/lib/validation";
import { Button, Field, Input } from "../shared/ui";
import { OrderDetailView } from "./OrderPage";

export function TrackPage() {
  const snap = useApp();
  const [num, setNum] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState<{ num?: string; phone?: string; notFound?: boolean }>({});
  const [foundId, setFoundId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const order = foundId ? snap?.data.orders.find((o) => o.id === foundId) : undefined;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = num.trim().toUpperCase().replace(/\s/g, "");
    const normalized = /^\d+$/.test(n) ? `DL-${n}` : n.replace(/^DL(\d)/, "DL-$1");
    const p = normalizeKePhone(phone);
    const next: typeof err = {};
    if (!/^DL-\d{4,}$/.test(normalized)) next.num = "Enter your order number, e.g. DL-10015.";
    if (!p) next.phone = "Enter the phone number used for the order.";
    setErr(next);
    setFoundId(null);
    if (next.num || next.phone || !snap) return;
    setBusy(true);
    // Small delay so the lookup feels like a request (and to slow guessing).
    setTimeout(() => {
      const o = snap.data.orders.find((x) => x.number === normalized && x.customer.phone === p);
      setBusy(false);
      if (o) setFoundId(o.id); else setErr({ notFound: true });
    }, 450);
  };

  return (
    <div className="container-page pt-6 md:pt-10">
      <div className="mx-auto max-w-4xl">
        <div className="grid gap-6 md:grid-cols-[1fr_1.1fr] md:items-center">
          <div>
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600"><PackageSearch className="h-5 w-5" aria-hidden /></span>
            <h1 className="text-[28px] sm:text-[34px]">Track your order</h1>
            <p className="mt-2 max-w-sm text-text-2">No account needed. Enter the order number from your confirmation and the phone number you used at checkout.</p>
          </div>
          <form onSubmit={submit} noValidate className="space-y-4 rounded-md border border-line bg-surface p-5 sm:p-6">
            <Field label="Order number" htmlFor="t-num" error={err.num} hint="Looks like DL-10015">
              <Input id="t-num" value={num} onChange={(e) => setNum(e.target.value)} placeholder="DL-10015" autoComplete="off" invalid={!!err.num}
                aria-describedby={err.num ? "t-num-err" : "t-num-hint"} />
            </Field>
            <Field label="Phone number" htmlFor="t-phone" error={err.phone}>
              <Input id="t-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" invalid={!!err.phone}
                aria-describedby={err.phone ? "t-phone-err" : undefined} />
            </Field>
            <Button type="submit" size="lg" block loading={busy} disabled={!snap}>Find my order</Button>
          </form>
        </div>

        <div aria-live="polite" className="mt-8">
          {err.notFound && (
            <div role="alert" className="flex gap-3 rounded-md border border-line bg-surface p-5">
              <SearchX className="h-6 w-6 shrink-0 text-text-3" aria-hidden />
              <div className="text-sm">
                <p className="font-semibold">No order matches those details</p>
                <p className="text-text-2">Check the order number and use the same phone number you entered at checkout. Still stuck? Call the shop on {snap?.data.settings.phone}.</p>
              </div>
            </div>
          )}
          {order && snap && <OrderDetailView order={order} settings={snap.data.settings} />}
        </div>
      </div>
    </div>
  );
}

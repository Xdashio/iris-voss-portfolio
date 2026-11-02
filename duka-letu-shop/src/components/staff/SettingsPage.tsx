"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, RotateCcw, Save } from "lucide-react";
import type { Settings } from "@/types";
import { useStaff } from "@/hooks/useApp";
import { resetDemoData, saveSettings } from "@/lib/actions";
import { uid } from "@/lib/ids";
import { useToast } from "../shared/toast";
import { Button, ConfirmDialog, Field, Input, Skeleton } from "../shared/ui";
import { PageHeader } from "./StaffShell";

function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-b border-line py-7 first:pt-0 last:border-0 lg:grid-cols-[260px_1fr] lg:gap-10">
      <div><h2 className="text-lg">{title}</h2><p className="mt-1 text-sm text-text-2">{sub}</p></div>
      <div className="rounded-md border border-line bg-surface p-5">{children}</div>
    </section>
  );
}

export function SettingsPage() {
  const { snap } = useStaff();
  const { attempt } = useToast();
  const [s, setS] = useState<Settings | null>(null);
  const [reset, setReset] = useState(false);
  const saved = snap?.data.settings;
  useEffect(() => { if (saved) setS(structuredClone(saved)); }, [saved]);

  if (!snap || !s) return <><Skeleton className="mb-6 h-9 w-40" /><Skeleton className="h-96 rounded-md" /></>;
  const dirty = JSON.stringify(s) !== JSON.stringify(saved);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS({ ...s, [k]: v });
  const setZone = (i: number, patch: Partial<Settings["zones"][number]>) => set("zones", s.zones.map((z, k) => (k === i ? { ...z, ...patch } : z)));
  const txt = (k: keyof Settings, label: string, opts: { hint?: string; type?: string; optional?: boolean } = {}) => (
    <Field label={label} htmlFor={`st-${k}`} hint={opts.hint} optional={opts.optional}>
      <Input id={`st-${k}`} type={opts.type ?? "text"} value={String(s[k] ?? "")} onChange={(e) => set(k, e.target.value as never)} aria-describedby={opts.hint ? `st-${k}-hint` : undefined} />
    </Field>
  );

  return (
    <form noValidate onSubmit={(e) => { e.preventDefault(); attempt(() => { saveSettings(s); return true; }, "Settings saved. The storefront is updated."); }}>
      <PageHeader title="Settings" sub="Shop details, payments, delivery and stock rules. Changes apply across the storefront and staff app."
        actions={<Button type="submit" disabled={!dirty}><Save className="h-4 w-4" aria-hidden /> {dirty ? "Save changes" : "Saved"}</Button>} />

      <Section title="Shop details" sub="Placeholders until the owner confirms the real details.">
        <div className="grid gap-4 sm:grid-cols-2">
          {txt("shopName", "Shop name")}
          {txt("tagline", "Tagline")}
          {txt("phone", "Phone (shown to customers)", { type: "tel" })}
          {txt("whatsapp", "WhatsApp number", { type: "tel", hint: "For the optional “Confirm on WhatsApp” button." })}
          {txt("email", "Email", { type: "email", optional: true })}
          {txt("hours", "Opening hours")}
          <div className="sm:col-span-2">{txt("address", "Address")}</div>
        </div>
      </Section>

      <Section title="M-Pesa" sub="Shown at checkout. In this demo, payments are simulated; live STK Push needs Safaricom Daraja approval.">
        <div className="grid gap-4 sm:grid-cols-2">
          {txt("tillNumber", "Till number (Buy Goods)")}
          {txt("paybillNumber", "Paybill business number")}
          <div className="sm:col-span-2">{txt("paybillAccountFormat", "Paybill account number format", { hint: "What customers should type as the account number." })}</div>
        </div>
      </Section>

      <Section title="Delivery zones" sub="Customers pick a zone at checkout and the fee is added automatically. Pickup is always free.">
        <ul className="space-y-2">
          {s.zones.map((z, i) => (
            <li key={z.id} className="grid grid-cols-[1fr_110px_auto] items-end gap-2 rounded-sm bg-canvas/70 p-2.5 sm:grid-cols-[140px_1fr_120px_auto]">
              <Field label="Zone name" htmlFor={`z${i}n`}><Input id={`z${i}n`} value={z.name} onChange={(e) => setZone(i, { name: e.target.value })} className="h-9" /></Field>
              <Field label="Areas covered" htmlFor={`z${i}a`} className="col-span-3 row-start-2 sm:col-span-1 sm:row-start-auto"><Input id={`z${i}a`} value={z.areas} onChange={(e) => setZone(i, { areas: e.target.value })} className="h-9" /></Field>
              <Field label="Fee (KES)" htmlFor={`z${i}f`}><Input id={`z${i}f`} inputMode="numeric" value={String(z.fee)} onChange={(e) => setZone(i, { fee: parseInt(e.target.value.replace(/\D/g, "") || "0", 10) })} className="num h-9" /></Field>
              <Button variant="ghost" size="icon" aria-label={`Remove ${z.name}`} disabled={s.zones.length === 1} onClick={() => set("zones", s.zones.filter((_, k) => k !== i))} className="h-9"><Trash2 className="h-4 w-4" /></Button>
            </li>
          ))}
        </ul>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => set("zones", [...s.zones, { id: uid("zone"), name: `Zone ${s.zones.length + 1}`, areas: "", fee: 0 }])}>
          <Plus className="h-4 w-4" aria-hidden /> Add zone
        </Button>
      </Section>

      <Section title="Inventory" sub="Variants at or below this number are flagged as low stock on the dashboard, inventory and storefront.">
        <Field label="Low-stock threshold" htmlFor="st-th" className="max-w-40">
          <Input id="st-th" inputMode="numeric" value={String(s.lowStockThreshold)} onChange={(e) => set("lowStockThreshold", parseInt(e.target.value.replace(/\D/g, "") || "0", 10))} className="num" />
        </Field>
        <p className="mt-4 text-sm text-text-2">Currency: <b>Kenyan shilling (KES)</b></p>
      </Section>

      <Section title="Demo data" sub="Restore the original sample catalogue, orders and sales. Useful before showing the prototype to someone new.">
        <Button variant="danger" onClick={() => setReset(true)}><RotateCcw className="h-4 w-4" aria-hidden /> Reset demo data</Button>
        <p className="mt-2 text-[13px] text-text-3">Uploaded photos stay in this browser but are no longer linked to any product.</p>
      </Section>

      {dirty && (
        <div className="sticky bottom-4 z-10 mt-4 flex items-center justify-between gap-3 rounded-md bg-ink-900 px-4 py-3 text-sm text-white shadow-pop">
          <span>You have unsaved changes</span>
          <span className="flex gap-2"><Button variant="inverse" size="sm" onClick={() => setS(structuredClone(saved!))}>Discard</Button><Button variant="accent" size="sm" type="submit">Save changes</Button></span>
        </div>
      )}

      <ConfirmDialog open={reset} onClose={() => setReset(false)} title="Reset all demo data?" confirmLabel="Reset everything"
        body="Products, stock, orders, till sales, staff and settings go back to the original sample data. Anything added during the demo is removed. You stay signed in."
        onConfirm={() => { if (attempt(() => { resetDemoData(); return true; }, "Demo data restored")) setReset(false); }} />
    </form>
  );
}

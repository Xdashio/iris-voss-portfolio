"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, FlaskConical, KeyRound } from "lucide-react";
import { useStaff } from "@/hooks/useApp";
import { login, DomainError } from "@/lib/actions";
import { ROLE_LABEL, ROLE_SUMMARY, can, homeFor, STAFF_NAV } from "@/lib/permissions";
import type { Role } from "@/types";
import { LogoMark } from "../shared/bits";
import { Button, Field, Input } from "../shared/ui";

const DEMO: { role: Role; username: string; pin: string }[] = [
  { role: "owner", username: "owner", pin: "1234" },
  { role: "cashier", username: "cashier", pin: "2345" },
  { role: "stock", username: "stock", pin: "3456" },
];

export function LoginPage() {
  const { snap, staff } = useStaff();
  const router = useRouter();
  const sp = useSearchParams();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const go = (role: Role) => {
    const next = sp.get("next");
    const nav = STAFF_NAV.find((n) => next && (next === n.href || next.startsWith(n.href + "/")));
    router.replace(next && next.startsWith("/staff") && nav && can({ role, active: true }, nav.perm) ? next : homeFor(role));
  };

  useEffect(() => { if (staff) go(staff.role); }, [staff]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !/^\d{4}$/.test(pin)) { setError("Enter your username and 4-digit PIN."); return; }
    setBusy(true);
    setTimeout(() => {
      try { login(username, pin); }
      catch (err) { setError(err instanceof DomainError ? err.message : "Could not sign in."); setPin(""); }
      setBusy(false);
    }, 350);
  };

  return (
    <main id="main" className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <section className="relative hidden flex-col justify-between bg-ink-900 p-10 text-white lg:flex" aria-label="About the staff area">
        <div className="flex items-center gap-2.5"><LogoMark className="h-9 w-9" inverse /><span className="font-display text-xl font-extrabold">{snap?.data.settings.shopName ?? "Duka Letu"}</span></div>
        <div>
          <p className="font-display text-[34px] font-bold leading-tight">Orders, stock and the till.<br /><span className="text-marigold-500">One shop, one count.</span></p>
          <p className="mt-4 max-w-md text-white/70">Online orders and counter sales draw from the same stock, so the website never sells what’s already gone.</p>
        </div>
        <p className="text-[13px] text-white/50">Staff area · Each person signs in with their own username and PIN.</p>
      </section>

      <section className="flex flex-col justify-center px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"><ArrowLeft className="h-4 w-4" aria-hidden /> Back to the shop</Link>
          <h1 className="text-[28px]">Staff sign in</h1>
          <p className="mt-1 text-text-2">Use your staff username and 4-digit PIN.</p>

          <form onSubmit={submit} noValidate className="mt-6 space-y-4">
            <Field label="Username" htmlFor="l-user">
              <Input id="l-user" autoComplete="username" autoCapitalize="none" value={username} onChange={(e) => { setUsername(e.target.value); setError(null); }} />
            </Field>
            <Field label="PIN" htmlFor="l-pin">
              <Input id="l-pin" type="password" inputMode="numeric" autoComplete="current-password" maxLength={4} value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setError(null); }} className="num tracking-[0.4em]" />
            </Field>
            {error && <p role="alert" className="rounded-sm bg-danger-100 px-3 py-2 text-sm font-medium text-danger-600">{error}</p>}
            <Button type="submit" size="lg" block loading={busy} disabled={!snap}><KeyRound className="h-4.5 w-4.5" aria-hidden /> Sign in</Button>
          </form>

          <div className="mt-8 rounded-md border border-marigold-200 bg-marigold-100/60 p-4">
            <p className="flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wider text-[#6b4a07]"><FlaskConical className="h-3.5 w-3.5" aria-hidden /> Demo accounts</p>
            <p className="mt-1 text-[13px] text-text-2">For demonstration only. Not production authentication.</p>
            <ul className="mt-3 divide-y divide-marigold-200">
              {DEMO.map((d) => (
                <li key={d.role} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-semibold">{ROLE_LABEL[d.role]} <span className="num font-normal text-text-2">· {d.username} / {d.pin}</span></p>
                    <p className="text-[12px] text-text-3">{ROLE_SUMMARY[d.role]}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => { setUsername(d.username); setPin(d.pin); setError(null); }} aria-label={`Fill in ${ROLE_LABEL[d.role]} demo login`}>Use</Button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}

"use client";

import { useState } from "react";
import { UserPlus, Pencil, KeyRound, Power } from "lucide-react";
import type { Role, Staff } from "@/types";
import { useStaff } from "@/hooks/useApp";
import { resetPin, saveStaff, setStaffActive } from "@/lib/actions";
import { ROLE_LABEL, ROLE_SUMMARY } from "@/lib/permissions";
import { fmtDate, fmtPhone } from "@/lib/format";
import { useToast } from "../shared/toast";
import { Badge, Button, ConfirmDialog, Dialog, Field, Input, Skeleton, cx } from "../shared/ui";
import { PageHeader } from "./StaffShell";

function StaffForm({ initial, onClose }: { initial: Partial<Staff>; onClose: () => void }) {
  const { attempt } = useToast();
  const [name, setName] = useState(initial.name ?? "");
  const [username, setUsername] = useState(initial.username ?? "");
  const [phone, setPhone] = useState(initial.phone ? "0" + initial.phone.slice(3) : "");
  const [role, setRole] = useState<Role>(initial.role ?? "cashier");
  const [pin, setPin] = useState("");
  const isNew = !initial.id;
  return (
    <Dialog open onClose={onClose} title={isNew ? "Add staff member" : `Edit ${initial.name}`}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" form="sform">{isNew ? "Add staff" : "Save"}</Button></>}>
      <form id="sform" noValidate className="space-y-4" onSubmit={(e) => {
        e.preventDefault();
        if (attempt(() => saveStaff({ id: initial.id, name, username, role, phone: phone || undefined, pin: isNew ? pin : undefined }), isNew ? `${name} added` : "Saved")) onClose();
      }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="s-name"><Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} data-autofocus /></Field>
          <Field label="Username" htmlFor="s-user" hint="Used to sign in."><Input id="s-user" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} autoCapitalize="none" aria-describedby="s-user-hint" /></Field>
          <Field label="Phone" optional htmlFor="s-phone"><Input id="s-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          {isNew && <Field label="4-digit PIN" htmlFor="s-pin"><Input id="s-pin" inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} className="num tracking-[0.3em]" /></Field>}
        </div>
        <fieldset>
          <legend className="mb-2 text-[13px] font-semibold">Role</legend>
          <div className="grid gap-2">
            {(["owner", "cashier", "stock"] as Role[]).map((r) => (
              <label key={r} htmlFor={`role-${r}`} className={cx("flex cursor-pointer items-start gap-3 rounded-sm border p-3", role === r ? "border-brand-600 bg-brand-50" : "border-line-strong hover:border-ink-700")}>
                <input id={`role-${r}`} type="radio" name="role" checked={role === r} onChange={() => setRole(r)} className="mt-1 accent-brand-600" />
                <span className="text-sm"><b>{ROLE_LABEL[r]}</b><span className="block text-[13px] text-text-2">{ROLE_SUMMARY[r]}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
      </form>
    </Dialog>
  );
}

export function TeamPage() {
  const { snap, staff: me } = useStaff();
  const { attempt } = useToast();
  const [editing, setEditing] = useState<Partial<Staff> | null>(null);
  const [pinFor, setPinFor] = useState<Staff | null>(null);
  const [newPin, setNewPin] = useState("");
  const [toggle, setToggle] = useState<Staff | null>(null);

  if (!snap) return <><Skeleton className="mb-6 h-9 w-40" /><Skeleton className="h-72 rounded-md" /></>;
  const list = [...snap.data.staff].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));

  return (
    <div>
      <PageHeader title="Staff" sub="Each person signs in with their own username and PIN. Their role decides what they can see and do."
        actions={<Button onClick={() => setEditing({})}><UserPlus className="h-4 w-4" aria-hidden /> Add staff</Button>} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((s) => (
          <article key={s.id} className={cx("rounded-md border border-line bg-surface p-4", !s.active && "opacity-70")}>
            <div className="flex items-start gap-3">
              <span className={cx("flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold", s.active ? "bg-ink-800 text-white" : "bg-sunken text-text-3")} aria-hidden>
                {s.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-sans text-[15px] font-bold">{s.name}{s.id === me?.id && <span className="font-normal text-text-3"> (you)</span>}</h2>
                <p className="num text-[13px] text-text-3">@{s.username}{s.phone && ` · ${fmtPhone(s.phone)}`}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone={s.role === "owner" ? "brand" : s.role === "cashier" ? "accent" : "clay"}>{ROLE_LABEL[s.role]}</Badge>
                  {s.active ? <Badge tone="success" dot>Active</Badge> : <Badge dot>Deactivated</Badge>}
                </div>
              </div>
            </div>
            <p className="mt-3 text-[12px] text-text-3">Added {fmtDate(s.createdAt)}</p>
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
              <Button size="sm" variant="outline" onClick={() => setEditing(s)}><Pencil className="h-3.5 w-3.5" aria-hidden /> Edit</Button>
              <Button size="sm" variant="outline" onClick={() => { setPinFor(s); setNewPin(""); }}><KeyRound className="h-3.5 w-3.5" aria-hidden /> Reset PIN</Button>
              {s.id !== me?.id && (
                <Button size="sm" variant="ghost" onClick={() => setToggle(s)} className={s.active ? "text-danger-600" : "text-success-600"}>
                  <Power className="h-3.5 w-3.5" aria-hidden /> {s.active ? "Deactivate" : "Reactivate"}
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
      <p className="mt-6 text-[12px] text-text-3">Demo PINs are stored in this browser only. The production system would use hashed credentials on a server.</p>

      {editing && <StaffForm initial={editing} onClose={() => setEditing(null)} />}
      {pinFor && (
        <Dialog open onClose={() => setPinFor(null)} size="sm" title={`Reset PIN for ${pinFor.name}`}
          footer={<><Button variant="outline" onClick={() => setPinFor(null)}>Cancel</Button><Button type="submit" form="pinform">Set PIN</Button></>}>
          <form id="pinform" onSubmit={(e) => { e.preventDefault(); if (attempt(() => { resetPin(pinFor.id, newPin); return true; }, `PIN updated for ${pinFor.name}`)) setPinFor(null); }}>
            <Field label="New 4-digit PIN" htmlFor="np" hint="Tell them in person. They sign in with it straight away.">
              <Input id="np" inputMode="numeric" maxLength={4} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))} className="num tracking-[0.3em]" data-autofocus aria-describedby="np-hint" />
            </Field>
          </form>
        </Dialog>
      )}
      <ConfirmDialog open={!!toggle} onClose={() => setToggle(null)} tone={toggle?.active ? "danger" : "primary"}
        title={toggle?.active ? `Deactivate ${toggle?.name}?` : `Reactivate ${toggle?.name}?`} confirmLabel={toggle?.active ? "Deactivate" : "Reactivate"}
        body={toggle?.active ? "They won’t be able to sign in. Their past sales and stock changes stay in the records." : "They can sign in again with their existing PIN."}
        onConfirm={() => { if (toggle && attempt(() => { setStaffActive(toggle.id, !toggle.active); return true; }, `${toggle.name} ${toggle.active ? "deactivated" : "reactivated"}`)) setToggle(null); }} />
    </div>
  );
}

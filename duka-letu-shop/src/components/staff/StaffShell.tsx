"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { FlaskConical, LogOut, Menu, ExternalLink, ShieldOff } from "lucide-react";
import { useStaff } from "@/hooks/useApp";
import { logout } from "@/lib/actions";
import { ROLE_LABEL, STAFF_NAV, can, homeFor } from "@/lib/permissions";
import { Icon, LogoMark } from "../shared/bits";
import { Button, Drawer, EmptyState, Spinner, cx } from "../shared/ui";

function routePerm(pathname: string) {
  const hit = [...STAFF_NAV].sort((a, b) => b.href.length - a.href.length).find((n) => pathname === n.href || pathname.startsWith(n.href + "/"));
  return hit?.perm;
}

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const { snap, staff } = useStaff();
  const pathname = usePathname();
  const pending = snap?.data.orders.filter((o) => o.status === "placed").length ?? 0;
  const threshold = snap?.data.settings.lowStockThreshold ?? 5;
  const low = snap?.data.products.reduce((n, p) => n + p.variants.filter((v) => v.stock <= threshold).length, 0) ?? 0;
  return (
    <ul className="space-y-0.5 px-3">
      {STAFF_NAV.filter((n) => can(staff, n.perm)).map((n) => {
        const active = n.href === "/staff" ? pathname === "/staff" : pathname.startsWith(n.href);
        const badge = n.href === "/staff/orders" ? pending : n.href === "/staff/inventory" ? low : 0;
        return (
          <li key={n.href}>
            <Link href={n.href} onClick={onNavigate} aria-current={active ? "page" : undefined}
              className={cx(
                "flex h-10 items-center gap-3 rounded-sm px-3 text-sm font-semibold transition-colors",
                active ? "bg-white/12 text-white shadow-[inset_3px_0_0_#f2b13a]" : "text-white/70 hover:bg-white/6 hover:text-white",
              )}>
              <Icon name={n.icon} className="h-[18px] w-[18px]" />
              <span className="flex-1">{n.label}</span>
              {badge > 0 && (
                <span className={cx("num rounded-xs px-1.5 text-[11px] font-bold", n.href === "/staff/orders" ? "bg-marigold-500 text-ink-950" : "bg-white/15 text-white")}
                  aria-label={n.href === "/staff/orders" ? `${badge} new orders` : `${badge} low-stock variants`}>{badge}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function StaffShell({ children }: { children: ReactNode }) {
  const { snap, staff } = useStaff();
  const pathname = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const shopName = snap?.data.settings.shopName ?? "Duka Letu";

  useEffect(() => {
    if (snap && !staff) router.replace(`/staff/login?next=${encodeURIComponent(pathname)}`);
  }, [snap, staff, pathname, router]);
  useEffect(() => { setMenu(false); }, [pathname]);

  if (!snap || !staff) return <div className="min-h-dvh bg-canvas"><Spinner label="Checking your session" /></div>;

  const perm = routePerm(pathname);
  const allowed = !perm || can(staff, perm);
  const initials = staff.name.split(" ").map((s) => s[0]).slice(0, 2).join("");

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <LogoMark className="h-8 w-8" inverse />
        <div className="min-w-0 leading-tight">
          <p className="truncate font-display text-[16px] font-extrabold text-white">{shopName}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">Shop manager</p>
        </div>
      </div>
      <nav aria-label="Staff" className="flex-1 overflow-y-auto py-2"><Nav onNavigate={() => setMenu(false)} /></nav>
      <div className="space-y-3 border-t border-white/10 p-4">
        <Link href="/" target="_blank" className="flex items-center gap-2 text-[13px] font-semibold text-white/70 hover:text-white">
          <ExternalLink className="h-4 w-4" aria-hidden /> View storefront
        </Link>
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-marigold-500 text-[13px] font-bold text-ink-950" aria-hidden>{initials}</span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-white">{staff.name}</p>
            <p className="text-[12px] text-white/55">{ROLE_LABEL[staff.role]}</p>
          </div>
          <button onClick={() => { logout(); router.replace("/staff/login"); }} className="rounded-sm p-2 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Log out">
            <LogOut className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-canvas lg:pl-60">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 bg-ink-900 lg:block print:hidden">{sidebar}</aside>

      <div className="sticky top-0 z-20 print:hidden">
        <div className="flex items-center justify-center gap-1.5 bg-marigold-500 px-3 py-1 text-center text-[11px] font-bold uppercase tracking-wider text-ink-950" role="note">
          <FlaskConical className="h-3.5 w-3.5 shrink-0" aria-hidden /> Demo mode · Sample data · Simulated payments
        </div>
        <header className="flex h-14 items-center gap-3 border-b border-line bg-surface px-4 lg:hidden">
          <Button variant="ghost" size="icon" className="-ml-2" onClick={() => setMenu(true)} aria-label="Open staff menu"><Menu className="h-5 w-5" /></Button>
          <LogoMark className="h-7 w-7" />
          <span className="font-display text-[16px] font-extrabold">{shopName}</span>
          <span className="ml-auto rounded-xs bg-sunken px-2 py-0.5 text-[12px] font-semibold text-text-2">{ROLE_LABEL[staff.role]}</span>
        </header>
      </div>

      <Drawer open={menu} onClose={() => setMenu(false)} side="left" title="Menu" width="max-w-[280px]">
        <div className="h-full bg-ink-900">{sidebar}</div>
      </Drawer>

      <main id="main" className="px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        {allowed ? children : (
          <div className="mx-auto max-w-lg">
            <h1 className="sr-only">No access</h1>
            <EmptyState icon={<ShieldOff />} title="You don’t have access to this page"
              body={`Your role (${ROLE_LABEL[staff.role]}) can’t open this section. Ask the owner if you need it.`}
              action={<Link href={homeFor(staff.role)} className="inline-flex h-10 items-center rounded-sm bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700">Go to my home page</Link>} />
          </div>
        )}
      </main>
    </div>
  );
}

export function PageHeader({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[24px] sm:text-[28px]">{title}</h1>
        {sub && <p className="mt-1 text-sm text-text-2">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

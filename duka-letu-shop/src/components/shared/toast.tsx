"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CircleCheck, CircleAlert, Info, X } from "lucide-react";
import { cx } from "./ui";
import { DomainError } from "@/lib/actions";
import { PermissionError } from "@/lib/permissions";

type Kind = "success" | "error" | "info";
interface Toast { id: number; kind: Kind; title: string; body?: string; action?: { label: string; onClick: () => void } }

interface Ctx {
  toast: (t: Omit<Toast, "id">) => void;
  /** Runs fn; shows business-rule errors as a toast. Returns undefined on failure. */
  attempt: <R>(fn: () => R, success?: string | ((r: R) => string)) => R | undefined;
}

const ToastCtx = createContext<Ctx | null>(null);
let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number) => setItems((x) => x.filter((t) => t.id !== id)), []);
  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = ++seq;
    setItems((x) => [...x.slice(-3), { ...t, id }]);
    setTimeout(() => dismiss(id), t.kind === "error" ? 6000 : 3800);
  }, [dismiss]);
  const attempt = useCallback(<R,>(fn: () => R, success?: string | ((r: R) => string)) => {
    try {
      const r = fn();
      if (success) toast({ kind: "success", title: typeof success === "function" ? success(r) : success });
      return r;
    } catch (e) {
      const known = e instanceof DomainError || e instanceof PermissionError;
      toast({ kind: "error", title: known ? (e as Error).message : "Something went wrong. Please try again." });
      if (!known) console.error(e);
      return undefined;
    }
  }, [toast]);

  return (
    <ToastCtx.Provider value={{ toast, attempt }}>
      {children}
      <div aria-live="polite" aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:bottom-4 sm:left-auto sm:right-4 sm:items-end sm:p-0 print:hidden">
        {items.map((t) => (
          <div key={t.id} role={t.kind === "error" ? "alert" : "status"}
            className="anim-rise pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md bg-ink-900 px-4 py-3 text-white shadow-pop">
            {t.kind === "success" ? <CircleCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#7dd3a8]" aria-hidden />
              : t.kind === "error" ? <CircleAlert className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#f4a09a]" aria-hidden />
              : <Info className="mt-0.5 h-4.5 w-4.5 shrink-0 text-marigold-500" aria-hidden />}
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-semibold">{t.title}</p>
              {t.body && <p className="mt-0.5 text-white/75">{t.body}</p>}
              {t.action && (
                <button className="mt-1.5 text-[13px] font-semibold text-marigold-500 underline-offset-2 hover:underline"
                  onClick={() => { t.action!.onClick(); dismiss(t.id); }}>{t.action.label}</button>
              )}
            </div>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className={cx("-mr-1 rounded-xs p-1 text-white/60 hover:text-white")}>
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast(): Ctx {
  const c = useContext(ToastCtx);
  if (!c) throw new Error("useToast outside ToastProvider");
  return c;
}

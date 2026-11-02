"use client";

import {
  forwardRef, useEffect, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode,
  type SelectHTMLAttributes, type TextareaHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, LoaderCircle, X, CircleAlert, RotateCcw } from "lucide-react";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ───────── Button ───────── */

type Variant = "primary" | "accent" | "secondary" | "outline" | "ghost" | "danger" | "success" | "inverse";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

const VARIANT: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 active:bg-ink-800 disabled:bg-line-strong",
  accent: "bg-marigold-500 text-ink-950 hover:bg-marigold-600 disabled:bg-line disabled:text-text-3",
  secondary: "bg-ink-800 text-white hover:bg-ink-900 disabled:bg-line-strong",
  outline: "border border-line-strong bg-surface text-text hover:border-ink-700 hover:bg-sunken disabled:text-text-3 disabled:hover:bg-surface disabled:hover:border-line-strong",
  ghost: "text-text hover:bg-sunken disabled:text-text-3",
  danger: "bg-danger-600 text-white hover:bg-[#a42a21] disabled:bg-line-strong",
  success: "bg-success-600 text-white hover:bg-[#186a3f] disabled:bg-line-strong",
  inverse: "bg-white/10 text-white hover:bg-white/20 border border-white/20",
};
const SIZE: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] gap-2",
  icon: "h-10 w-10 justify-center",
  "icon-sm": "h-8 w-8 justify-center",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, block, className, children, disabled, type = "button", ...rest }, ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-sm font-semibold transition-colors disabled:cursor-not-allowed",
        VARIANT[variant], SIZE[size], block && "w-full", className,
      )}
      {...rest}
    >
      {loading && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

/* ───────── Form fields ───────── */

export function Field({ label, hint, error, children, htmlFor, optional, className }: {
  label: ReactNode; hint?: ReactNode; error?: string | null; children: ReactNode; htmlFor: string; optional?: boolean; className?: string;
}) {
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-text">
        {label}{optional && <span className="ml-1 font-normal text-text-3">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-err`} className="flex items-center gap-1 text-[13px] text-danger-600" role="alert">
          <CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden /> {error}
        </p>
      ) : hint ? <p id={`${htmlFor}-hint`} className="text-[13px] text-text-3">{hint}</p> : null}
    </div>
  );
}

const inputBase =
  "h-10 w-full rounded-sm border bg-surface px-3 text-[15px] text-text placeholder:text-text-3 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:bg-sunken disabled:text-text-3";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ className, invalid, ...rest }, ref) {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cx(inputBase, invalid ? "border-danger-600" : "border-line-strong focus:border-brand-600", className)}
        {...rest}
      />
    );
  },
);

export function Textarea({ className, invalid, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cx(inputBase, "h-auto min-h-24 py-2 leading-relaxed", invalid ? "border-danger-600" : "border-line-strong focus:border-brand-600", className)}
      {...rest}
    />
  );
}

export function Select({ className, invalid, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <div className={cx("relative", className)}>
      <select
        aria-invalid={invalid || undefined}
        className={cx(inputBase, "appearance-none pr-9", invalid ? "border-danger-600" : "border-line-strong focus:border-brand-600")}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" aria-hidden />
    </div>
  );
}

export function Checkbox({ id, label, checked, onChange, description }: {
  id: string; label: ReactNode; checked: boolean; onChange: (v: boolean) => void; description?: ReactNode;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-sm">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded-xs border-line-strong accent-brand-600" />
      <span>
        <span className="font-medium">{label}</span>
        {description && <span className="block text-[13px] text-text-3">{description}</span>}
      </span>
    </label>
  );
}

/* ───────── Badge ───────── */

type Tone = "neutral" | "brand" | "accent" | "success" | "warning" | "danger" | "info" | "clay";
const TONE: Record<Tone, string> = {
  neutral: "bg-sunken text-text-2",
  brand: "bg-brand-100 text-brand-700",
  accent: "bg-marigold-100 text-[#7a5208]",
  success: "bg-success-100 text-success-600",
  warning: "bg-warning-100 text-warning-600",
  danger: "bg-danger-100 text-danger-600",
  info: "bg-info-100 text-info-600",
  clay: "bg-clay-100 text-clay-600",
};
export function Badge({ tone = "neutral", children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-xs px-1.5 py-0.5 text-[12px] font-semibold leading-4", TONE[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

/* ───────── Overlay primitives ───────── */

function useFocusTrap(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const sel = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const first = el?.querySelector<HTMLElement>("[data-autofocus]") ?? el?.querySelector<HTMLElement>(sel);
    (first ?? el)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); closeRef.current(); }
      if (e.key === "Tab" && el) {
        const f = [...el.querySelectorAll<HTMLElement>(sel)].filter((x) => x.offsetParent !== null);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [open]);
  return ref;
}

export function Dialog({ open, onClose, title, description, children, footer, size = "md" }: {
  open: boolean; onClose: () => void; title: ReactNode; description?: ReactNode; children?: ReactNode; footer?: ReactNode; size?: "sm" | "md" | "lg";
}) {
  const ref = useFocusTrap(open, onClose);
  const id = useId();
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="anim-fade absolute inset-0 bg-ink-950/55" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-t`}
        aria-describedby={description ? `${id}-d` : undefined}
        tabIndex={-1}
        className={cx(
          "anim-rise relative flex max-h-[92dvh] w-full flex-col rounded-t-lg bg-surface shadow-dialog focus:outline-none sm:rounded-lg",
          size === "sm" ? "sm:max-w-md" : size === "md" ? "sm:max-w-lg" : "sm:max-w-3xl",
        )}
      >
        <div className="flex items-start gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id={`${id}-t`} className="text-lg">{title}</h2>
            {description && <p id={`${id}-d`} className="mt-1 text-sm text-text-2">{description}</p>}
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close dialog"><X className="h-4 w-4" /></Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-canvas/60 px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ open, onClose, title, children, side = "right", footer, width = "max-w-md" }: {
  open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; side?: "left" | "right"; footer?: ReactNode; width?: string;
}) {
  const ref = useFocusTrap(open, onClose);
  const id = useId();
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="anim-fade absolute inset-0 bg-ink-950/55" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-t`}
        tabIndex={-1}
        className={cx(
          "absolute top-0 flex h-full w-[88%] flex-col bg-surface shadow-dialog focus:outline-none", width,
          side === "right" ? "anim-drawer-right right-0" : "anim-drawer-left left-0",
        )}
      >
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <h2 id={`${id}-t`} className="flex-1 text-lg">{title}</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, body, confirmLabel, tone = "danger", children, busy }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; body: ReactNode; confirmLabel: string;
  tone?: "danger" | "primary"; children?: ReactNode; busy?: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title} size="sm"
      footer={<>
        <Button variant="outline" onClick={onClose}>Keep as is</Button>
        <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={busy}>{confirmLabel}</Button>
      </>}>
      <div className="text-sm text-text-2">{body}</div>
      {children}
    </Dialog>
  );
}

/* ───────── States ───────── */

export function EmptyState({ icon, title, body, action, className }: {
  icon: ReactNode; title: string; body?: ReactNode; action?: ReactNode; className?: string;
}) {
  return (
    <div className={cx("flex flex-col items-center px-6 py-14 text-center", className)}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sunken text-text-2 [&_svg]:h-6 [&_svg]:w-6">{icon}</div>
      <h2 className="text-lg">{title}</h2>
      {body && <p className="mt-1.5 max-w-sm text-sm text-text-2">{body}</p>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", body, onRetry }: { title?: string; body?: ReactNode; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-md border border-danger-100 bg-danger-100/40 px-6 py-10 text-center">
      <CircleAlert className="mb-3 h-7 w-7 text-danger-600" aria-hidden />
      <h2 className="text-lg">{title}</h2>
      {body && <p className="mt-1 max-w-sm text-sm text-text-2">{body}</p>}
      {onRetry && <Button variant="outline" className="mt-4" onClick={onRetry}><RotateCcw className="h-4 w-4" /> Try again</Button>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton rounded-sm", className)} aria-hidden />;
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-text-2" role="status">
      <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden /> {label}…
    </div>
  );
}

/* ───────── Quantity stepper ───────── */

export function QtyStepper({ value, min = 1, max, onChange, size = "md", label = "Quantity" }: {
  value: number; min?: number; max: number; onChange: (n: number) => void; size?: "sm" | "md"; label?: string;
}) {
  const h = size === "sm" ? "h-8" : "h-10";
  const w = size === "sm" ? "w-8" : "w-10";
  return (
    <div className={cx("inline-flex items-stretch rounded-sm border border-line-strong bg-surface", h)} role="group" aria-label={label}>
      <button type="button" className={cx(w, "flex items-center justify-center text-text-2 hover:bg-sunken disabled:text-line-strong")}
        onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Decrease quantity">
        <span aria-hidden className="text-lg leading-none">−</span>
      </button>
      <input
        type="text" inputMode="numeric" aria-label={label}
        className="num w-10 border-x border-line bg-transparent text-center text-sm font-semibold focus:outline-none"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/\D/g, "") || "0", 10);
          onChange(Math.max(min, Math.min(max, n)));
        }}
      />
      <button type="button" className={cx(w, "flex items-center justify-center text-text-2 hover:bg-sunken disabled:text-line-strong")}
        onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Increase quantity">
        <span aria-hidden className="text-lg leading-none">+</span>
      </button>
    </div>
  );
}

/* ───────── Segmented control ───────── */

export function Segmented<T extends string>({ value, onChange, options, label, size = "md" }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode; count?: number }[]; label: string; size?: "sm" | "md";
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded-sm border border-line bg-sunken p-0.5">
      {options.map((o) => (
        <button
          key={o.value} role="tab" type="button" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={cx(
            "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xs font-semibold transition-colors",
            size === "sm" ? "h-7 px-2.5 text-[12px]" : "h-8 px-3 text-[13px]",
            value === o.value ? "bg-surface text-text shadow-[0_1px_2px_rgb(11_42_47/0.08)]" : "text-text-2 hover:text-text",
          )}
        >
          {o.label}
          {o.count !== undefined && <span className={cx("num rounded-xs px-1 text-[11px]", value === o.value ? "bg-brand-100 text-brand-700" : "bg-line text-text-2")}>{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

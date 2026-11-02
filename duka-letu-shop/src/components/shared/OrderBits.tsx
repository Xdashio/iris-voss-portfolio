"use client";

import { Check, X } from "lucide-react";
import type { Order, OrderStatus, PaymentStatus } from "@/types";
import { FLOW, PAYMENT_STATUS_LABEL, STATUS_LABEL } from "@/lib/orders";
import { fmtDateTime } from "@/lib/format";
import { Badge, cx } from "./ui";

const STATUS_TONE: Record<OrderStatus, "neutral" | "info" | "brand" | "accent" | "success" | "danger"> = {
  placed: "info",
  packed: "accent",
  out_for_delivery: "brand",
  ready_for_pickup: "brand",
  delivered: "success",
  collected: "success",
  cancelled: "danger",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={STATUS_TONE[status]} dot>{STATUS_LABEL[status]}</Badge>;
}

const PAY_TONE: Record<PaymentStatus, "success" | "warning" | "danger" | "neutral" | "info"> = {
  paid: "success", pending: "warning", failed: "danger", unpaid: "neutral", refunded: "info",
};
export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <Badge tone={PAY_TONE[status]}>{PAYMENT_STATUS_LABEL[status]}</Badge>;
}

/** Fulfilment-specific progress tracker. Only relevant steps are shown. */
export function OrderTracker({ order, compact }: { order: Order; compact?: boolean }) {
  const flow = FLOW[order.fulfilment];
  const cancelled = order.status === "cancelled";
  const reached = new Map(order.history.map((h) => [h.status, h.at]));
  const currentIdx = cancelled ? -1 : flow.indexOf(order.status);

  if (cancelled) {
    const ev = order.history.find((h) => h.status === "cancelled");
    return (
      <div className="flex items-start gap-3 rounded-md border border-danger-100 bg-danger-100/50 p-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger-600 text-white"><X className="h-4 w-4" aria-hidden /></span>
        <div className="text-sm">
          <p className="font-semibold">Order cancelled{ev ? ` · ${fmtDateTime(ev.at)}` : ""}</p>
          {ev?.note && <p className="text-text-2">{ev.note}</p>}
        </div>
      </div>
    );
  }

  return (
    <ol className={cx("grid", compact ? "gap-0" : "gap-0")} style={{ gridTemplateColumns: `repeat(${flow.length}, minmax(0, 1fr))` }} aria-label="Order progress">
      {flow.map((s, i) => {
        const done = i <= currentIdx;
        const current = i === currentIdx;
        return (
          <li key={s} className="relative flex flex-col items-center text-center" aria-current={current ? "step" : undefined}>
            {i > 0 && <span className={cx("absolute right-1/2 top-[13px] h-[3px] w-full -translate-y-1/2", i <= currentIdx ? "bg-brand-600" : "bg-line")} aria-hidden />}
            <span className={cx(
              "relative z-10 flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 text-[11px] font-bold",
              done ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong bg-surface text-text-3",
              current && "ring-4 ring-brand-100",
            )}>
              {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
            </span>
            <span className={cx("mt-2 px-1 text-[12px] font-semibold leading-tight sm:text-[13px]", done ? "text-text" : "text-text-3")}>{STATUS_LABEL[s]}</span>
            {!compact && reached.get(s) && <span className="num mt-0.5 hidden text-[11px] text-text-3 sm:block">{fmtDateTime(reached.get(s)!)}</span>}
            <span className="sr-only">{done ? (current ? "(current step)" : "(done)") : "(upcoming)"}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function StatusHistory({ order }: { order: Order }) {
  return (
    <ol className="space-y-3">
      {[...order.history].reverse().map((h, i) => (
        <li key={i} className="flex gap-3 text-sm">
          <span className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", i === 0 ? "bg-brand-600" : "bg-line-strong")} aria-hidden />
          <div>
            <p><b>{STATUS_LABEL[h.status]}</b> <span className="text-text-3">· {h.by}</span></p>
            <p className="num text-[12px] text-text-3">{fmtDateTime(h.at)}</p>
            {h.note && <p className="text-[13px] text-text-2">{h.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

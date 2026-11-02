"use client";

import { useEffect, useState } from "react";
import { CircleCheck, CircleX, LoaderCircle, Smartphone, FlaskConical } from "lucide-react";
import type { Order, Settings } from "@/types";
import { simulateMpesaResult } from "@/lib/actions";
import { fmtPhone, money } from "@/lib/format";
import { useToast } from "../shared/toast";
import { Button, Dialog } from "../shared/ui";

type Phase = "prompt" | "waiting" | "success" | "failed";

/**
 * Simulated STK push. Clearly labelled as a demo: no request is sent to
 * Safaricom and no money moves.
 */
export function MpesaDialog({ order, settings, open, onClose }: { order: Order; settings: Settings; open: boolean; onClose: () => void }) {
  const { attempt } = useToast();
  const [phase, setPhase] = useState<Phase>("prompt");
  useEffect(() => { if (open) setPhase(order.paymentStatus === "paid" ? "success" : "prompt"); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const till = order.paymentMethod === "mpesa_till";
  const run = (outcome: "success" | "failed") => {
    setPhase("waiting");
    setTimeout(() => {
      const r = attempt(() => simulateMpesaResult(order.id, outcome));
      setPhase(r ? (outcome === "success" ? "success" : "failed") : "failed");
    }, 1400);
  };

  return (
    <Dialog open={open} onClose={phase === "waiting" ? () => {} : onClose} size="sm"
      title={phase === "success" ? "Payment received" : phase === "failed" ? "Payment not completed" : `Pay ${money(order.total)} with M-Pesa`}
      description={phase === "prompt" ? `Order ${order.number}` : undefined}>
      <div className="mb-4 flex items-start gap-2 rounded-sm bg-marigold-100 px-3 py-2 text-[12px] text-[#6b4a07]">
        <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        <span><b>Demo simulation.</b> No request is sent to M-Pesa and no money moves. In the live system this prompt comes from Safaricom.</span>
      </div>

      {phase === "prompt" && (
        <>
          <ol className="space-y-1.5 text-sm text-text-2">
            <li>1. A payment prompt is sent to <b className="num text-text">{fmtPhone(order.customer.phone)}</b>.</li>
            <li>2. Check the {till ? "Buy Goods" : "Paybill"} details, then enter your M-Pesa PIN.</li>
            <li>3. This page updates when payment is confirmed.</li>
          </ol>
          {/* Phone mock */}
          <div className="mx-auto mt-5 w-full max-w-[260px] rounded-[22px] border-[6px] border-ink-900 bg-ink-900 p-1">
            <div className="rounded-[14px] bg-[#f3f4f2] px-4 pb-4 pt-5 text-center">
              <Smartphone className="mx-auto h-5 w-5 text-text-3" aria-hidden />
              <p className="mt-2 text-[12px] leading-relaxed text-text">
                Pay <b>{money(order.total)}</b> to <b>{settings.shopName.toUpperCase()}</b>
                {till ? <> Till <b className="num">{settings.tillNumber}</b></> : <> Paybill <b className="num">{settings.paybillNumber}</b> Acc. <b>{order.number}</b></>}?
              </p>
              <div className="mx-auto mt-3 h-8 w-36 rounded-xs border border-line-strong bg-surface text-left text-[12px] leading-8 text-text-3">&nbsp;Enter M-PESA PIN</div>
            </div>
          </div>
          <div className="mt-5 grid gap-2">
            <Button variant="success" size="lg" onClick={() => run("success")} data-autofocus>Simulate: customer enters PIN</Button>
            <Button variant="outline" onClick={() => run("failed")}>Simulate: customer cancels</Button>
          </div>
        </>
      )}

      {phase === "waiting" && (
        <div className="flex flex-col items-center py-8 text-center" role="status">
          <LoaderCircle className="h-9 w-9 animate-spin text-brand-600" aria-hidden />
          <p className="mt-3 font-semibold">Waiting for M-Pesa confirmation…</p>
          <p className="text-sm text-text-2">Don’t close this window.</p>
        </div>
      )}

      {phase === "success" && (
        <div className="flex flex-col items-center py-4 text-center">
          <CircleCheck className="h-12 w-12 text-success-600" aria-hidden />
          <p className="mt-3 text-[15px] font-semibold">{money(order.total)} paid</p>
          <p className="num text-sm text-text-2">Ref {order.paymentRef ?? "—"} (simulated)</p>
          <Button className="mt-5" onClick={onClose} block>View my order</Button>
        </div>
      )}

      {phase === "failed" && (
        <div className="flex flex-col items-center py-4 text-center">
          <CircleX className="h-12 w-12 text-danger-600" aria-hidden />
          <p className="mt-3 text-sm text-text-2">The payment was cancelled or timed out. Your order is saved. You can try again now.</p>
          <div className="mt-5 grid w-full gap-2">
            <Button onClick={() => setPhase("prompt")}>Try again</Button>
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

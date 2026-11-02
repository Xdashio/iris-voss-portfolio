import type { Fulfilment, Order, OrderStatus, PaymentMethod, PaymentStatus } from "@/types";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "Placed",
  packed: "Packed",
  out_for_delivery: "Out for delivery",
  ready_for_pickup: "Ready for pickup",
  delivered: "Delivered",
  collected: "Collected",
  cancelled: "Cancelled",
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  mpesa_till: "M-Pesa Till",
  mpesa_paybill: "M-Pesa Paybill",
  cash: "Cash on pickup",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Awaiting M-Pesa",
  paid: "Paid",
  failed: "Payment failed",
  unpaid: "Pay at pickup",
  refunded: "Refunded",
};

/** The happy path for each fulfilment method. Irrelevant steps are never shown. */
export const FLOW: Record<Fulfilment, OrderStatus[]> = {
  pickup: ["placed", "packed", "ready_for_pickup", "collected"],
  delivery: ["placed", "packed", "out_for_delivery", "delivered"],
};

export const isFinal = (s: OrderStatus) => s === "delivered" || s === "collected" || s === "cancelled";

/** Next forward status for an order, or null if finished. */
export function nextStatus(o: Pick<Order, "fulfilment" | "status">): OrderStatus | null {
  if (isFinal(o.status)) return null;
  const flow = FLOW[o.fulfilment];
  const i = flow.indexOf(o.status);
  return i >= 0 && i < flow.length - 1 ? flow[i + 1] : null;
}

export const NEXT_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  packed: "Mark packed",
  ready_for_pickup: "Mark ready for pickup",
  out_for_delivery: "Send out for delivery",
  collected: "Mark collected",
  delivered: "Mark delivered",
};

/** Validates a requested transition. Returns an error message or null. */
export function transitionError(o: Order, to: OrderStatus): string | null {
  if (isFinal(o.status)) return `This order is already ${STATUS_LABEL[o.status].toLowerCase()}.`;
  if (to === "cancelled") return null;
  if (to !== nextStatus(o)) return `Cannot move from ${STATUS_LABEL[o.status]} to ${STATUS_LABEL[to]}.`;
  if ((to === "collected" || to === "delivered") && o.paymentStatus !== "paid")
    return "Record payment before completing this order.";
  return null;
}

export const isPendingWork = (o: Order) => !isFinal(o.status);

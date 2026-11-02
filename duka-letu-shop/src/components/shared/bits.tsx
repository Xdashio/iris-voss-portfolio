"use client";

import {
  Boxes, Cctv, ClipboardList, CookingPot, Flashlight, LayoutDashboard, Lightbulb, Package, PlugZap, ScanBarcode,
  Settings, Speaker, Tv, Users, Warehouse, Wrench, type LucideProps,
} from "lucide-react";
import { money } from "@/lib/format";
import { stockLevel, type StockLevel } from "@/lib/calculations";
import { Badge, cx } from "./ui";

const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  Boxes, Cctv, ClipboardList, CookingPot, Flashlight, LayoutDashboard, Lightbulb, Package, PlugZap, ScanBarcode,
  Settings, Speaker, Tv, Users, Warehouse, Wrench,
};

/** Resolves the icon names stored in data (categories, nav). */
export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const C = ICONS[name] ?? Package;
  return <C aria-hidden {...props} />;
}

export function Price({ value, className, size = "md" }: { value: number; className?: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const s = { sm: "text-sm", md: "text-base", lg: "text-xl", xl: "text-[28px] leading-none" }[size];
  return <span className={cx("num font-display font-bold tracking-tight text-text", s, className)}>{money(value)}</span>;
}

export const STOCK_TEXT: Record<StockLevel, string> = { in: "In stock", low: "Few left", out: "Out of stock" };

export function StockBadge({ stock, threshold, showCount }: { stock: number; threshold: number; showCount?: boolean }) {
  const lvl = stockLevel(stock, threshold);
  const tone = lvl === "in" ? "success" : lvl === "low" ? "warning" : "danger";
  const text = lvl === "low" && showCount ? `Only ${stock} left` : lvl === "in" && showCount ? `${stock} in stock` : STOCK_TEXT[lvl];
  return <Badge tone={tone} dot>{text}</Badge>;
}

export function LevelBadge({ level }: { level: StockLevel }) {
  return <Badge tone={level === "in" ? "success" : level === "low" ? "warning" : "danger"} dot>{STOCK_TEXT[level]}</Badge>;
}

/** Placeholder mark until the owner supplies a logo: a shop awning over a "D". */
export function LogoMark({ className, inverse }: { className?: string; inverse?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect width="40" height="40" rx="6" fill={inverse ? "#f2b13a" : "#0f6e68"} />
      <path d="M6 13h28l-2.5 5.5a3.6 3.6 0 0 1-6.3 0 3.6 3.6 0 0 1-6.4 0 3.6 3.6 0 0 1-6.3 0 3.6 3.6 0 0 1-3.9 1.8L6 13Z"
        fill={inverse ? "#0b2a2f" : "#f2b13a"} />
      <path d="M13 23h6.2c4 0 6.8 2.4 6.8 5.9 0 3.6-2.8 5.9-6.8 5.9H13V23Zm4 3.3v5.2h2.1c1.8 0 2.9-1 2.9-2.6s-1.1-2.6-2.9-2.6H17Z"
        fill={inverse ? "#0b2a2f" : "#fff"} />
    </svg>
  );
}

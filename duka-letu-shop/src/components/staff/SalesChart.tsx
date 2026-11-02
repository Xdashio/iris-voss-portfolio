"use client";

import { useEffect, useRef, useState } from "react";
import type { DaySales } from "@/lib/calculations";
import { money, moneyCompact } from "@/lib/format";
import { Segmented } from "../shared/ui";

const SHOP = "var(--color-chart-shop)";
const ONLINE = "var(--color-chart-online)";

function niceMax(v: number) {
  if (v <= 0) return 1000;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

/**
 * Seven-day stacked bars: shop (POS) at the base, online on top, combined
 * total labelled above each bar. Hover/focus shows a tooltip; a table view is
 * available for screen readers and anyone who prefers numbers.
 */
export function SalesChart({ days }: { days: DaySales[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(640);
  const [hover, setHover] = useState<number | null>(null);
  const [view, setView] = useState<"chart" | "table">("chart");

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [view]);

  const H = 240, padL = 48, padR = 8, padT = 22, padB = 28;
  const max = niceMax(Math.max(...days.map((d) => d.pos + d.online)));
  const plotW = w - padL - padR, plotH = H - padT - padB;
  const slot = plotW / days.length;
  const barW = Math.min(44, slot * 0.56);
  const y = (v: number) => padT + plotH - (v / max) * plotH;
  const ticks = [0, max / 2, max];
  const totals = days.map((d) => d.pos + d.online);
  const sum = (k: "pos" | "online") => days.reduce((s, d) => s + d[k], 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap items-center gap-4 text-[13px] text-text-2" aria-label="Legend">
          <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: SHOP }} aria-hidden /> Shop (POS) <b className="num text-text">{moneyCompact(sum("pos"))}</b></li>
          <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: ONLINE }} aria-hidden /> Online <b className="num text-text">{moneyCompact(sum("online"))}</b></li>
        </ul>
        <Segmented size="sm" label="Chart view" value={view} onChange={setView} options={[{ value: "chart", label: "Chart" }, { value: "table", label: "Table" }]} />
      </div>

      {view === "table" ? (
        <div className="overflow-x-auto rounded-sm border border-line">
          <table className="w-full text-sm">
            <caption className="sr-only">Sales for the last 7 days, shop and online</caption>
            <thead className="bg-canvas text-left text-[12px] uppercase tracking-wider text-text-3">
              <tr><th className="px-3 py-2 font-semibold">Day</th><th className="px-3 py-2 text-right font-semibold">Shop</th><th className="px-3 py-2 text-right font-semibold">Online</th><th className="px-3 py-2 text-right font-semibold">Total</th></tr>
            </thead>
            <tbody className="num divide-y divide-line">
              {days.map((d, i) => (
                <tr key={d.day}><td className="px-3 py-2">{i === days.length - 1 ? "Today" : d.label}</td><td className="px-3 py-2 text-right">{money(d.pos)}</td><td className="px-3 py-2 text-right">{money(d.online)}</td><td className="px-3 py-2 text-right font-semibold">{money(totals[i])}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={wrap} className="relative" onMouseLeave={() => setHover(null)}>
          <svg width={w} height={H} role="img" aria-label={`Sales for the last 7 days. Total ${money(totals.reduce((a, b) => a + b, 0))}. Switch to table view for figures.`} className="block">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={padL} x2={w - padR} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeDasharray={t === 0 ? undefined : "2 4"} />
                <text x={padL - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill="var(--color-text-3)" className="num">{t === 0 ? "0" : moneyCompact(t).replace("KES ", "")}</text>
              </g>
            ))}
            {days.map((d, i) => {
              const cx = padL + slot * i + slot / 2;
              const x = cx - barW / 2;
              const posH = (d.pos / max) * plotH;
              const onH = (d.online / max) * plotH;
              const gap = d.pos > 0 && d.online > 0 ? 2 : 0;
              const today = i === days.length - 1;
              const dim = hover !== null && hover !== i;
              return (
                <g key={d.day} opacity={dim ? 0.45 : 1} style={{ transition: "opacity 120ms" }}>
                  {/* hit target larger than the mark */}
                  <rect x={padL + slot * i} y={padT} width={slot} height={plotH + padB} fill="transparent"
                    tabIndex={0} role="button" aria-label={`${today ? "Today" : d.label}: shop ${money(d.pos)}, online ${money(d.online)}, total ${money(totals[i])}`}
                    onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} className="focus:outline-none" />
                  {posH > 0 && <path pointerEvents="none" fill={SHOP} d={roundedTop(x, y(d.pos), barW, posH, d.online > 0 ? 0 : 4)} />}
                  {onH > 0 && <path pointerEvents="none" fill={ONLINE} d={roundedTop(x, y(d.pos + d.online), barW, Math.max(0, onH - gap), 4)} />}
                  <text pointerEvents="none" x={cx} y={y(totals[i]) - 6} textAnchor="middle" fontSize="11" fontWeight={600} fill="var(--color-text-2)" className="num">
                    {totals[i] ? moneyCompact(totals[i]).replace("KES ", "") : ""}
                  </text>
                  <text pointerEvents="none" x={cx} y={H - 8} textAnchor="middle" fontSize="12" fontWeight={today ? 700 : 500} fill={today ? "var(--color-text)" : "var(--color-text-3)"}>
                    {today ? "Today" : d.label}
                  </text>
                </g>
              );
            })}
          </svg>
          {hover !== null && (
            <div className="pointer-events-none absolute z-10 w-44 rounded-sm bg-ink-900 px-3 py-2 text-[12px] text-white shadow-pop"
              style={{ left: Math.min(Math.max(0, padL + slot * hover + slot / 2 - 88), w - 176), top: Math.max(0, y(totals[hover]) - 92) }}>
              <p className="mb-1 font-semibold">{hover === days.length - 1 ? "Today" : new Date(days[hover].day).toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "short" })}</p>
              <p className="flex justify-between gap-2"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px]" style={{ background: SHOP }} />Shop</span><span className="num">{money(days[hover].pos)}</span></p>
              <p className="flex justify-between gap-2"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px]" style={{ background: ONLINE }} />Online</span><span className="num">{money(days[hover].online)}</span></p>
              <p className="mt-1 flex justify-between gap-2 border-t border-white/15 pt-1 font-semibold"><span>Total</span><span className="num">{money(totals[hover])}</span></p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function roundedTop(x: number, top: number, w: number, h: number, r: number) {
  const rr = Math.min(r, h, w / 2);
  const b = top + h;
  return `M${x},${b} V${top + rr} Q${x},${top} ${x + rr},${top} H${x + w - rr} Q${x + w},${top} ${x + w},${top + rr} V${b} Z`;
}

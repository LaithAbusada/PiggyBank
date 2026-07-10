"use client";

import { useRef, useState } from "react";
import { useCurrency } from "@/lib/currency";
import {
  isoToParts,
  monthLabel,
  shiftMonth,
  type MonthRef,
  type Transaction,
} from "@/lib/dashboard-data";

type Props = {
  txns: Transaction[];
  month: MonthRef;
  height?: number;
};

const MONTHS_SHOWN = 6;

export default function TrendChart({ txns, month, height = 150 }: Props) {
  const { fmt } = useCurrency();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const months: MonthRef[] = [];
  for (let i = MONTHS_SHOWN - 1; i >= 0; i--) months.push(shiftMonth(month, -i));

  const sums = months.map(() => ({ inc: 0, exp: 0 }));
  txns.forEach((t) => {
    if (!t._dateISO) return;
    const p = isoToParts(t._dateISO);
    const idx = months.findIndex((m) => m.year === p.year && m.month === p.month);
    if (idx < 0) return;
    if (t.type === "in") sums[idx].inc += Math.abs(t.amount);
    else sums[idx].exp += Math.abs(t.amount);
  });

  const max = Math.max(...sums.map((s) => Math.max(s.inc, s.exp)), 1);
  const w = 100;
  const n = MONTHS_SHOWN;
  const groupW = w / n;
  const barW = (groupW / 2) * 0.62;
  const gap = (groupW - barW * 2) / 2;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    setHoverIdx(Math.min(n - 1, Math.floor(ratio * n)));
  };

  const tooltipLeftPct = hoverIdx != null ? ((hoverIdx + 0.5) / n) * 100 : 0;
  const tooltipFlip = tooltipLeftPct > 65;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3 className="display" style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            Monthly trends
          </h3>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
            Last 6 months to {monthLabel(month)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--ink-3)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--pos)" }} />
            Income
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--neg)" }} />
            Expense
          </span>
        </div>
      </div>

      <div
        ref={wrapRef}
        onMouseMove={onMove}
        onMouseLeave={() => setHoverIdx(null)}
        style={{ position: "relative" }}
      >
        <svg
          viewBox={`0 0 ${w} ${height}`}
          preserveAspectRatio="none"
          style={{ width: "100%", height, display: "block" }}
        >
          {[0.25, 0.5, 0.75].map((p) => (
            <line
              key={p}
              x1="0"
              x2={w}
              y1={height * p}
              y2={height * p}
              stroke="var(--line-2)"
              strokeWidth="0.3"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {sums.map((s, i) => {
            const ih = (s.inc / max) * (height - 20);
            const eh = (s.exp / max) * (height - 20);
            const xBase = i * groupW + gap;
            const isHover = i === hoverIdx;
            return (
              <g key={i}>
                <rect
                  x={xBase}
                  y={height - ih - 4}
                  width={barW}
                  height={ih}
                  rx={barW * 0.25}
                  fill="var(--pos)"
                  opacity={isHover ? 1 : 0.9}
                />
                <rect
                  x={xBase + barW}
                  y={height - eh - 4}
                  width={barW}
                  height={eh}
                  rx={barW * 0.25}
                  fill="var(--neg)"
                  opacity={isHover ? 1 : 0.8}
                />
              </g>
            );
          })}
        </svg>

        {hoverIdx != null && (
          <div
            style={{
              position: "absolute",
              left: `${tooltipLeftPct}%`,
              top: 8,
              transform: tooltipFlip ? "translateX(calc(-100% - 10px))" : "translateX(10px)",
              background: "var(--surface)",
              border: "1px solid var(--line)",
              boxShadow: "var(--shadow-sm)",
              borderRadius: 10,
              padding: "8px 10px",
              fontSize: 11,
              pointerEvents: "none",
              zIndex: 1,
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ color: "var(--ink-3)", fontSize: 10, marginBottom: 4 }}>
              {monthLabel(months[hoverIdx])}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--pos)" }} />
              <span style={{ color: "var(--ink-3)" }}>Income</span>
              <span className="num" style={{ fontWeight: 600 }}>
                {fmt(sums[hoverIdx].inc, { short: true })}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--neg)" }} />
              <span style={{ color: "var(--ink-3)" }}>Expense</span>
              <span className="num" style={{ fontWeight: 600 }}>
                {fmt(sums[hoverIdx].exp, { short: true })}
              </span>
            </div>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${n}, 1fr)`,
            fontSize: 10,
            color: "var(--ink-3)",
            marginTop: 6,
            textAlign: "center",
          }}
        >
          {months.map((m, i) => (
            <span key={i}>
              {new Date(m.year, m.month, 1).toLocaleDateString("en-US", { month: "short" })}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

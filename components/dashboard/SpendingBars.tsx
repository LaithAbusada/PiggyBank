"use client";

import { useCurrency } from "@/lib/currency";

type Segment = { label: string; value: number; color: string };

type Props = {
  segments: Segment[];
  total: number;
};

export default function SpendingBars({ segments, total }: Props) {
  const { fmt } = useCurrency();
  const max = segments.reduce((m, s) => Math.max(m, s.value), 0) || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {segments.map((s, i) => {
        const pctOfMax = (s.value / max) * 100;
        const pctOfTotal = total ? ((s.value / total) * 100).toFixed(0) : "0";
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                fontSize: 13,
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--ink-2)" }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
                {s.label}
              </span>
              <span style={{ display: "inline-flex", alignItems: "baseline", gap: 8 }}>
                <span className="num" style={{ color: "var(--ink-3)", fontSize: 12 }}>{pctOfTotal}%</span>
                <span className="num" style={{ fontWeight: 600 }}>{fmt(s.value, { short: true })}</span>
              </span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: "var(--line-2)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${pctOfMax}%`,
                  height: "100%",
                  background: s.color,
                  borderRadius: 999,
                  transition: "width .3s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

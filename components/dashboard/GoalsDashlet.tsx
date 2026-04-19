"use client";

import { useCurrency } from "@/lib/currency";
import { GOALS } from "@/lib/dashboard-data";

export default function GoalsDashlet() {
  const { fmt } = useCurrency();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {GOALS.map((g, i) => {
        const pct = Math.min(100, (g.saved / g.target) * 100);
        return (
          <div key={i}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 6,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>{g.emoji}</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{g.name}</span>
              </div>
              <span className="num" style={{ fontSize: 12, color: "var(--ink-3)" }}>
                {fmt(g.saved, { short: true })} / {fmt(g.target, { short: true })}
              </span>
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 999,
                background: "var(--line-2)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: g.color,
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

"use client";

import { useCurrency } from "@/lib/currency";
import { CATEGORIES_OPTIONS } from "@/lib/dashboard-data";

type Props = {
  spendByCat: Record<string, number>;
  budgets: Record<string, number>;
};

export default function CategoryBudgets({ spendByCat, budgets }: Props) {
  const { fmt } = useCurrency();
  const rows = Object.entries(budgets)
    .map(([cat, budget]) => {
      const spent = spendByCat[cat] || 0;
      const pct = budget > 0 ? (spent / budget) * 100 : 0;
      const meta = CATEGORIES_OPTIONS.find((c) => c.key === cat);
      return { cat, budget, spent, pct, color: meta ? meta.color : "oklch(0.60 0.02 280)" };
    })
    .sort((a, b) => b.pct - a.pct);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {rows.map((r) => {
        const over = r.spent > r.budget;
        return (
          <div key={r.cat}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
                fontSize: 13,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: r.color }} />
                <span style={{ fontWeight: 600 }}>{r.cat}</span>
              </span>
              <span
                className="num"
                style={{ color: over ? "var(--neg)" : "var(--ink-3)", fontSize: 12 }}
              >
                {fmt(r.spent, { short: true })} / {fmt(r.budget, { short: true })}
              </span>
            </div>
            <div
              style={{
                height: 5,
                borderRadius: 999,
                background: "var(--line-2)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, r.pct)}%`,
                  height: "100%",
                  background: over ? "var(--neg)" : r.color,
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

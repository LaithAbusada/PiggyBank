"use client";

import { useCurrency } from "@/lib/currency";
import type { Transaction } from "@/lib/dashboard-data";

type Props = {
  /** Transactions already filtered to the selected month. */
  txns: Transaction[];
};

export default function TopMerchants({ txns }: Props) {
  const { fmt } = useCurrency();

  const byTitle: Record<string, { amount: number; count: number }> = {};
  txns.forEach((t) => {
    if (t.type !== "out") return;
    const key = t.title;
    if (!byTitle[key]) byTitle[key] = { amount: 0, count: 0 };
    byTitle[key].amount += Math.abs(t.amount);
    byTitle[key].count += 1;
  });
  const top = Object.entries(byTitle)
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 5);
  const max = top.length > 0 ? top[0][1].amount : 1;

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <h3 className="display" style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
          Top merchants
        </h3>
        <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
          Biggest expense totals this month
        </div>
      </div>

      {top.length === 0 ? (
        <div style={{ padding: "12px 0", color: "var(--ink-3)", fontSize: 13 }}>
          No expenses this month yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {top.map(([title, v]) => (
            <div key={title}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 8,
                  marginBottom: 4,
                  fontSize: 13,
                }}
              >
                <span style={{ minWidth: 0, display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span
                    style={{
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {title}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--ink-3)", flexShrink: 0 }}>
                    {v.count} txn{v.count === 1 ? "" : "s"}
                  </span>
                </span>
                <span className="num" style={{ fontWeight: 600, fontSize: 12, flexShrink: 0 }}>
                  {fmt(v.amount, { short: true })}
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
                    width: `${Math.max(2, (v.amount / max) * 100)}%`,
                    height: "100%",
                    background: "var(--accent)",
                    borderRadius: 999,
                    transition: "width .3s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

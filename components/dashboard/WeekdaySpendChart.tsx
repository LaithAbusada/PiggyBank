"use client";

import { useCurrency } from "@/lib/currency";
import { isoToParts, WEEKDAYS, type Transaction } from "@/lib/dashboard-data";

type Props = {
  /** Transactions already filtered to the selected month. */
  txns: Transaction[];
};

export default function WeekdaySpendChart({ txns }: Props) {
  const { fmt } = useCurrency();

  const totals = Array(7).fill(0) as number[];
  txns.forEach((t) => {
    if (t.type !== "out" || !t._dateISO) return;
    const p = isoToParts(t._dateISO);
    const weekday = new Date(p.year, p.month, p.day).getDay();
    totals[weekday] += Math.abs(t.amount);
  });
  const total = totals.reduce((s, v) => s + v, 0);
  const max = Math.max(...totals, 1);

  const w = 280;
  const h = 150;
  const slotW = w / 7;
  const barW = 26;
  const barBottom = h - 20;
  const barMaxH = 96;

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <h3 className="display" style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
          Weekday pattern
        </h3>
        <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
          Spending by day of week
        </div>
      </div>

      {total === 0 ? (
        <div style={{ padding: "12px 0", color: "var(--ink-3)", fontSize: 13 }}>
          No expenses this month yet.
        </div>
      ) : (
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", display: "block" }}>
          {totals.map((v, i) => {
            const bh = (v / max) * barMaxH;
            const x = i * slotW + (slotW - barW) / 2;
            const yTop = barBottom - bh;
            const cx = i * slotW + slotW / 2;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={yTop}
                  width={barW}
                  height={Math.max(bh, v > 0 ? 2 : 0)}
                  rx={5}
                  fill="var(--accent)"
                  opacity={v === max ? 1 : 0.75}
                />
                {v > 0 && (
                  <text
                    x={cx}
                    y={yTop - 5}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight={600}
                    fill="var(--ink-2)"
                    style={{ fontFamily: "inherit" }}
                  >
                    {fmt(v, { short: true })}
                  </text>
                )}
                <text
                  x={cx}
                  y={h - 5}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--ink-3)"
                  style={{ fontFamily: "inherit" }}
                >
                  {WEEKDAYS[i]}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

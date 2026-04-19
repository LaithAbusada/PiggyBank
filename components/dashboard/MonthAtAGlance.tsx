"use client";

import { useCurrency } from "@/lib/currency";

type Props = {
  monthSpent: number;
  monthBudget: number;
  daysElapsed: number;
  daysInMonth: number;
};

export default function MonthAtAGlance({
  monthSpent,
  monthBudget,
  daysElapsed,
  daysInMonth,
}: Props) {
  const { fmt } = useCurrency();
  const daysLeft = Math.max(0, daysInMonth - daysElapsed);
  const avgDaily = daysElapsed > 0 ? monthSpent / daysElapsed : 0;
  const projected = avgDaily * daysInMonth;
  const pace = monthBudget > 0 ? projected / monthBudget : 0;
  const onTrack = pace <= 1;
  const pct = monthBudget > 0 ? Math.min(100, (monthSpent / monthBudget) * 100) : 0;
  const monthName = new Date().toLocaleDateString("en-US", { month: "long" });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <div>
          <div className="kicker">{monthName} so far</div>
          <div className="num" style={{ fontSize: 28, fontWeight: 700, marginTop: 2 }}>
            {fmt(monthSpent, { short: true })}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Avg / day
          </div>
          <div className="num" style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>
            {fmt(avgDaily, { short: true })}
          </div>
        </div>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 999,
          background: "var(--line-2)",
          overflow: "hidden",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: onTrack ? "var(--pos)" : "var(--neg)",
            borderRadius: 999,
            transition: "width .3s ease",
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-3)" }}>
        <span>{daysElapsed}/{daysInMonth} days</span>
        <span>{daysLeft} days left</span>
      </div>
      <div
        style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 14,
          background: onTrack
            ? "color-mix(in oklch, var(--pos) 10%, white)"
            : "color-mix(in oklch, var(--neg) 10%, white)",
          fontSize: 12,
          lineHeight: 1.4,
          color: onTrack ? "oklch(0.35 0.15 155)" : "oklch(0.42 0.18 25)",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 2 }}>
          {onTrack ? "✓ On pace" : "⚠ Over pace"}
        </div>
        Projected this month:{" "}
        <span className="num" style={{ fontWeight: 700 }}>
          {fmt(projected, { short: true })}
        </span>
        {monthBudget > 0 && <> of {fmt(monthBudget, { short: true })} budget</>}
      </div>
    </div>
  );
}

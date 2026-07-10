"use client";

import { useCurrency } from "@/lib/currency";
import { currentMonth, isFutureMonth, isSameMonth, monthLabel, type MonthRef } from "@/lib/dashboard-data";

type Props = {
  /** Per-day expense totals for the selected month (index 0 = day 1). */
  expSeries: number[];
  monthBudget: number;
  month: MonthRef;
  height?: number;
};

export default function BudgetPaceChart({ expSeries, monthBudget, month, height = 150 }: Props) {
  const { fmt } = useCurrency();

  const daysInMonth = expSeries.length;
  const isCurrent = isSameMonth(month, currentMonth());
  const today = new Date();
  const daysElapsed = isCurrent
    ? Math.min(today.getDate(), daysInMonth)
    : isFutureMonth(month)
      ? 0
      : daysInMonth;

  const cum: number[] = [];
  let running = 0;
  for (let i = 0; i < daysInMonth; i++) {
    running += expSeries[i] || 0;
    cum.push(running);
  }
  const spent = daysElapsed > 0 ? cum[daysElapsed - 1] : 0;
  const over = monthBudget > 0 && spent > monthBudget;

  const w = 100;
  const step = daysInMonth > 1 ? w / (daysInMonth - 1) : w;
  const yMax = Math.max(monthBudget, spent, 1);
  const y = (v: number) => height - (v / yMax) * (height - 20) - 4;

  // Actual cumulative points, up to today for the current month.
  const pts: [number, number][] = [];
  for (let i = 0; i < daysElapsed; i++) pts.push([i * step, y(cum[i])]);

  const linePath = (points: [number, number][]) =>
    points.length < 2 ? "" : "M " + points.map(([px, py]) => `${px} ${py}`).join(" L ");

  // Split the actual line where it crosses the budget so the over portion reads as --neg.
  let crossIdx = -1;
  for (let i = 0; i < daysElapsed; i++) {
    if (cum[i] > monthBudget) {
      crossIdx = i;
      break;
    }
  }
  let underPts: [number, number][] = pts;
  let overPts: [number, number][] = [];
  if (crossIdx === 0) {
    underPts = [];
    overPts = pts;
  } else if (crossIdx > 0) {
    const prevV = cum[crossIdx - 1];
    const t = (monthBudget - prevV) / (cum[crossIdx] - prevV);
    const crossing: [number, number] = [(crossIdx - 1 + t) * step, y(monthBudget)];
    underPts = [...pts.slice(0, crossIdx), crossing];
    overPts = [crossing, ...pts.slice(crossIdx)];
  }

  const fillPath =
    pts.length >= 2
      ? linePath(pts) + ` L ${pts[pts.length - 1][0]} ${height} L ${pts[0][0]} ${height} Z`
      : "";

  const todayX = isCurrent && daysElapsed > 0 ? (daysElapsed - 1) * step : null;
  const lastPt = pts.length > 0 ? pts[pts.length - 1] : null;

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
            Budget pace
          </h3>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
            Cumulative spend · {monthLabel(month)}
          </div>
        </div>
        <div className="num" style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Spent
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: over ? "var(--neg)" : "var(--ink)" }}>
            {fmt(spent, { short: true })}
          </div>
        </div>
      </div>

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

        {/* Even budget pace: end-of-day convention to match the cumulative series —
            day i (0-based) sits at budget * (i + 1) / daysInMonth. */}
        {monthBudget > 0 && (
          <line
            x1={0}
            y1={y(monthBudget / daysInMonth)}
            x2={w}
            y2={y(monthBudget)}
            stroke="var(--ink-3)"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {fillPath && <path d={fillPath} fill="var(--accent-soft)" opacity={0.7} />}

        {underPts.length >= 2 && (
          <path
            d={linePath(underPts)}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.8"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {overPts.length >= 2 && (
          <path
            d={linePath(overPts)}
            fill="none"
            stroke="var(--neg)"
            strokeWidth="1.8"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {todayX != null && (
          <line
            x1={todayX}
            x2={todayX}
            y1={0}
            y2={height}
            stroke="var(--ink-3)"
            strokeWidth="0.6"
            strokeDasharray="2 2"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {lastPt && (
          <circle
            cx={lastPt[0]}
            cy={lastPt[1]}
            r="2.6"
            fill={over ? "var(--neg)" : "var(--accent)"}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 11,
          color: "var(--ink-3)",
          marginTop: 6,
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 14,
              borderTop: "2px dashed var(--ink-3)",
              display: "inline-block",
            }}
          />
          Even pace to {fmt(monthBudget, { short: true })}
        </span>
        {isCurrent ? (
          <span>Day {daysElapsed} of {daysInMonth}</span>
        ) : (
          <span>{daysInMonth} days</span>
        )}
      </div>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { useCurrency } from "@/lib/currency";

type Mode = "area" | "line" | "bar";

type Props = {
  income: number[];
  expense: number[];
  labels: string[];
  /** Optional ISO-like labels for each data point (e.g. "May 3"). Defaults to numeric day index. */
  pointLabels?: string[];
  height?: number;
  mode?: Mode;
};

const EXPENSE_COLOR = "oklch(0.66 0.21 25)";

export default function AreaChart({
  income,
  expense,
  labels,
  pointLabels,
  height = 180,
  mode = "area",
}: Props) {
  const { fmt } = useCurrency();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const max = Math.max(...income, ...expense, 1);
  const w = 100;
  const n = income.length;
  const step = n > 1 ? w / (n - 1) : w;

  const toPath = (arr: number[], close = false) => {
    const pts = arr.map((v, i) => [i * step, height - (v / max) * (height - 20) - 4] as const);
    if (pts.length === 0) return "";
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const cx = (x0 + x1) / 2;
      d += ` Q ${cx} ${y0}, ${cx} ${(y0 + y1) / 2} T ${x1} ${y1}`;
    }
    if (close) d += ` L ${w} ${height} L 0 ${height} Z`;
    return d;
  };

  const gridLines = (
    <>
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
    </>
  );

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = wrapRef.current;
    if (!el || n === 0) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const idx = Math.min(n - 1, Math.max(0, Math.round(ratio * (n - 1))));
    setHoverIdx(idx);
  };

  const onLeave = () => setHoverIdx(null);

  const hoverX = hoverIdx != null ? (hoverIdx * step) : 0;
  const hoverIncY = hoverIdx != null ? height - (income[hoverIdx] / max) * (height - 20) - 4 : 0;
  const hoverExpY = hoverIdx != null ? height - (expense[hoverIdx] / max) * (height - 20) - 4 : 0;

  // Tooltip horizontal placement (left/right of cursor) so it doesn't clip near edges.
  const tooltipLeftPct = hoverIdx != null ? (hoverIdx / Math.max(1, n - 1)) * 100 : 0;
  const tooltipFlip = tooltipLeftPct > 65;

  const pointLabel = hoverIdx != null
    ? (pointLabels?.[hoverIdx] ?? String(hoverIdx + 1))
    : "";

  return (
    <div
      ref={wrapRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ position: "relative" }}
    >
      <svg
        viewBox={`0 0 ${w} ${height}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height, display: "block" }}
      >
        {mode === "area" && (
          <defs>
            <linearGradient id="incArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="expArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={EXPENSE_COLOR} stopOpacity="0.22" />
              <stop offset="100%" stopColor={EXPENSE_COLOR} stopOpacity="0" />
            </linearGradient>
          </defs>
        )}
        {gridLines}

        {mode === "bar" ? (
          <g>
            {income.map((iv, i) => {
              const ev = expense[i] ?? 0;
              const groupW = w / n;
              const barW = Math.max(0.5, (groupW / 2) * 0.72);
              const gap = (groupW - barW * 2) / 2;
              const xBase = i * groupW + gap;
              const ih = (iv / max) * (height - 20);
              const eh = (ev / max) * (height - 20);
              const isHover = i === hoverIdx;
              return (
                <g key={i}>
                  <rect
                    x={xBase}
                    y={height - ih - 4}
                    width={barW}
                    height={ih}
                    rx={barW * 0.25}
                    fill="var(--accent)"
                    opacity={isHover ? 1 : 0.95}
                  />
                  <rect
                    x={xBase + barW}
                    y={height - eh - 4}
                    width={barW}
                    height={eh}
                    rx={barW * 0.25}
                    fill={EXPENSE_COLOR}
                    opacity={isHover ? 1 : 0.85}
                  />
                </g>
              );
            })}
          </g>
        ) : (
          <>
            {mode === "area" && (
              <>
                <path d={toPath(income, true)} fill="url(#incArea)" />
                <path d={toPath(expense, true)} fill="url(#expArea)" />
              </>
            )}
            <path
              d={toPath(income)}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.8"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={toPath(expense)}
              fill="none"
              stroke={EXPENSE_COLOR}
              strokeWidth="1.8"
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}

        {hoverIdx != null && (
          <g pointerEvents="none">
            <line
              x1={hoverX}
              x2={hoverX}
              y1={0}
              y2={height}
              stroke="var(--ink-3)"
              strokeWidth="0.6"
              strokeDasharray="2 2"
              vectorEffect="non-scaling-stroke"
            />
            {mode !== "bar" && (
              <>
                <circle cx={hoverX} cy={hoverIncY} r="2.4" fill="var(--accent)" vectorEffect="non-scaling-stroke" />
                <circle cx={hoverX} cy={hoverExpY} r="2.4" fill={EXPENSE_COLOR} vectorEffect="non-scaling-stroke" />
              </>
            )}
          </g>
        )}
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
          <div style={{ color: "var(--ink-3)", fontSize: 10, marginBottom: 4 }}>{pointLabel}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--accent)" }} />
            <span style={{ color: "var(--ink-3)" }}>Income</span>
            <span className="num" style={{ fontWeight: 600 }}>
              {fmt(income[hoverIdx] ?? 0, { short: true })}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: EXPENSE_COLOR }} />
            <span style={{ color: "var(--ink-3)" }}>Expense</span>
            <span className="num" style={{ fontWeight: 600 }}>
              {fmt(expense[hoverIdx] ?? 0, { short: true })}
            </span>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--ink-3)", marginTop: 6 }}>
        {labels.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
    </div>
  );
}

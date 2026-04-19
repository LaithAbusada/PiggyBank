"use client";

import { useCurrency } from "@/lib/currency";

type Segment = { label: string; value: number; color: string };

type Props = {
  segments: Segment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
};

export default function DonutChart({
  segments,
  size = 180,
  thickness = 22,
  centerLabel,
  centerValue,
}: Props) {
  const { fmt } = useCurrency();
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={c} cy={c} r={r} fill="none" stroke="var(--line-2)" strokeWidth={thickness} />
          {segments.map((s, i) => {
            const frac = total ? s.value / total : 0;
            const dash = frac * circ;
            const gap = circ - dash;
            const el = (
              <circle
                key={i}
                cx={c}
                cy={c}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offset}
                style={{ transition: "stroke-dasharray .3s ease" }}
              />
            );
            offset += dash;
            return el;
          })}
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-3)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {centerLabel}
          </div>
          <div className="num" style={{ fontSize: 24, fontWeight: 700, marginTop: 2 }}>
            {centerValue}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 160, display: "flex", flexDirection: "column", gap: 8 }}>
        {segments.map((s, i) => {
          const pct = total ? ((s.value / total) * 100).toFixed(0) : 0;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
              <span style={{ flex: 1, color: "var(--ink-2)" }}>{s.label}</span>
              <span className="num" style={{ color: "var(--ink-3)", fontSize: 12 }}>{pct}%</span>
              <span className="num" style={{ fontWeight: 600, minWidth: 56, textAlign: "right" }}>
                {fmt(s.value, { short: true })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

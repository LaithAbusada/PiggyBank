"use client";

import { useCurrency } from "@/lib/currency";

type Props = {
  values: number[];
  labels: string[];
  color: string;
  height?: number;
  highlightLast?: boolean;
};

export default function BarChart({ values, labels, color, height = 120, highlightLast = false }: Props) {
  const { fmt } = useCurrency();
  const max = Math.max(...values);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height, marginBottom: 6 }}>
        {values.map((v, i) => {
          const h = (v / max) * 100;
          const isLast = i === values.length - 1;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                height: "100%",
                justifyContent: "flex-end",
                position: "relative",
              }}
            >
              {highlightLast && isLast && (
                <div
                  style={{
                    position: "absolute",
                    top: -26,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--ink)",
                    color: "var(--bg)",
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "4px 8px",
                    borderRadius: 8,
                    whiteSpace: "nowrap",
                  }}
                >
                  {fmt(v)}
                </div>
              )}
              <div
                style={{
                  height: `${h}%`,
                  background: color,
                  borderRadius: 6,
                  opacity: highlightLast && !isLast ? 0.55 : 1,
                  transition: "opacity .2s ease",
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {labels.map((l, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 10,
              color: "var(--ink-3)",
              letterSpacing: "0.04em",
            }}
          >
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useCurrency } from "@/lib/currency";
import { CATEGORIES_OPTIONS } from "@/lib/dashboard-data";
import { IconArrowDown, IconArrowUp, IconClose, IconPlus } from "@/lib/icons";

export type Recurring = {
  id: string;
  type: "in" | "out";
  title: string;
  sub: string;
  cat: string;
  amount: number;
  dayOfMonth: number;
};

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export default function RecurringCard({
  items,
  onAddClick,
  onRemove,
}: {
  items: Recurring[];
  onAddClick: () => void;
  onRemove: (id: string) => Promise<void> | void;
}) {
  const { fmt } = useCurrency();

  const monthlyIn = items.filter((r) => r.type === "in").reduce((s, r) => s + r.amount, 0);
  const monthlyOut = items.filter((r) => r.type === "out").reduce((s, r) => s + r.amount, 0);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div>
          <h3 className="display" style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            Monthly recurring
          </h3>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
            Auto-posted each month
          </div>
        </div>
        <button className="btn btn--ghost btn--sm" onClick={onAddClick} aria-label="Add recurring">
          <IconPlus size={14} />
        </button>
      </div>

      {items.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 12,
            fontSize: 11,
          }}
        >
          <span
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 10,
              background: "color-mix(in oklch, var(--pos) 10%, white)",
              color: "oklch(0.38 0.16 155)",
            }}
          >
            <div style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>In</div>
            <div className="num" style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>
              +{fmt(monthlyIn, { short: true })}
            </div>
          </span>
          <span
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 10,
              background: "var(--accent-soft)",
              color: "var(--accent-ink)",
            }}
          >
            <div style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Out</div>
            <div className="num" style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>
              -{fmt(monthlyOut, { short: true })}
            </div>
          </span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.length === 0 ? (
          <button
            onClick={onAddClick}
            style={{
              padding: "14px",
              border: "1px dashed var(--line)",
              borderRadius: 12,
              background: "transparent",
              color: "var(--ink-3)",
              fontSize: 13,
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            Add your salary, rent, or subscription
          </button>
        ) : (
          items.map((r) => {
            const meta = CATEGORIES_OPTIONS.find((c) => c.key === r.cat);
            const color = meta?.color ?? "oklch(0.60 0.02 280)";
            return (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "var(--surface-2)",
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `color-mix(in oklch, ${color} 20%, white)`,
                    color,
                    flexShrink: 0,
                  }}
                >
                  {r.type === "in" ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.title}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                    {ordinal(r.dayOfMonth)} · {r.cat}
                  </div>
                </div>
                <div
                  className="num"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: r.type === "in" ? "var(--pos)" : "var(--ink)",
                  }}
                >
                  {r.type === "in" ? "+" : "-"}
                  {fmt(r.amount, { short: true })}
                </div>
                <button
                  onClick={() => onRemove(r.id)}
                  aria-label={`Remove ${r.title}`}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: "var(--surface)",
                    color: "var(--ink-3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <IconClose size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

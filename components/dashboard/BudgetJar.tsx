"use client";

import { useState } from "react";
import { useCurrency } from "@/lib/currency";

type Props = {
  spent: number;
  budget: number;
  onSetBudget: (v: number) => void;
};

export default function BudgetJar({ spent, budget, onSetBudget }: Props) {
  const { fmt } = useCurrency();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string | number>(budget);
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const remaining = Math.max(0, budget - spent);
  const over = spent > budget;

  const save = () => {
    const v = parseFloat(String(draft));
    if (v > 0) onSetBudget(v);
    setEditing(false);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            position: "relative",
            width: 88,
            height: 96,
            flexShrink: 0,
            borderRadius: "18px 18px 32px 32px",
            background: "var(--surface-2)",
            border: "2px solid var(--line)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -2,
              left: -2,
              right: -2,
              height: 12,
              background: "var(--ink)",
              borderRadius: "16px 16px 0 0",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: `${pct}%`,
              background: over
                ? "linear-gradient(180deg, oklch(0.72 0.20 25), oklch(0.58 0.22 25))"
                : "linear-gradient(180deg, color-mix(in oklch, var(--accent) 60%, white), var(--accent))",
              transition: "height .4s ease",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: "rgba(255,255,255,0.45)",
              }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              top: 16,
              left: "50%",
              transform: "translateX(-50%)",
              width: 28,
              height: 3,
              borderRadius: 2,
              background: "oklch(0.35 0.02 280)",
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-3)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {over ? "Over budget" : "Remaining"}
          </div>
          <div
            className="num"
            style={{
              fontSize: 26,
              fontWeight: 700,
              marginTop: 2,
              color: over ? "var(--neg)" : "var(--ink)",
            }}
          >
            {over ? "-" : ""}
            {fmt(Math.abs(over ? spent - budget : remaining), { short: true })}
          </div>
          {editing ? (
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <input
                type="number"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && save()}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--accent)",
                  outline: "none",
                  fontSize: 13,
                  fontFamily: "var(--font-display)",
                }}
              />
              <button onClick={save} className="btn btn--ink btn--sm" style={{ padding: "6px 10px" }}>
                ✓
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setDraft(budget);
                setEditing(true);
              }}
              style={{ marginTop: 4, fontSize: 12, color: "var(--ink-3)", textDecoration: "underline" }}
            >
              of {fmt(budget, { short: true })} budget · edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

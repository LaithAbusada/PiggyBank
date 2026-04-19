"use client";

import { useState } from "react";
import { useCurrency } from "@/lib/currency";
import type { TransactionInput } from "@/lib/dashboard-data";

const QUICK_PRESETS = [
  { label: "Coffee",    amount: 4.5, icon: "☕", cat: "Restaurants",    title: "Coffee" },
  { label: "Lunch",     amount: 12,  icon: "🥙", cat: "Restaurants",    title: "Lunch" },
  { label: "Groceries", amount: 60,  icon: "🛒", cat: "Groceries",      title: "Groceries" },
  { label: "Gas",       amount: 45,  icon: "⛽", cat: "Transportation", title: "Fuel" },
  { label: "Taxi",      amount: 8,   icon: "🚕", cat: "Transportation", title: "Taxi" },
  { label: "Snack",     amount: 3,   icon: "🍫", cat: "Restaurants",    title: "Snack" },
];

export default function QuickAdd({ onAdd }: { onAdd: (t: TransactionInput) => Promise<void> | void }) {
  const { fmt } = useCurrency();
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const tap = async (p: (typeof QUICK_PRESETS)[number]) => {
    if (busy) return;
    setBusy(p.label);
    try {
      await onAdd({
        type: "out",
        title: p.title,
        sub: p.label,
        note: "Quick-add",
        cat: p.cat,
        amount: -p.amount,
        date: new Date().toISOString(),
      });
      setFlash(p.label);
      setTimeout(() => setFlash(null), 1200);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {QUICK_PRESETS.map((p) => {
          const isBusy = busy === p.label;
          const disabled = busy !== null;
          return (
            <button
              key={p.label}
              onClick={() => tap(p)}
              disabled={disabled}
              aria-busy={isBusy}
              style={{
                padding: "10px 8px",
                borderRadius: 14,
                background: flash === p.label ? "var(--accent-soft)" : "var(--surface-2)",
                border: "1px solid var(--line)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                transition: "background .15s ease, transform .12s ease, opacity .15s ease",
                cursor: disabled ? "default" : "pointer",
                opacity: disabled && !isBusy ? 0.5 : 1,
              }}
              onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(0.96)"; }}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <span style={{ fontSize: 20, lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", height: 20 }}>
                {isBusy ? <span className="pb-spin" style={{ color: "var(--accent-ink)" }} /> : p.icon}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600 }}>{p.label}</span>
              <span className="num" style={{ fontSize: 10, color: "var(--ink-3)" }}>
                {fmt(p.amount, { short: true })}
              </span>
            </button>
          );
        })}
      </div>
      <div
        style={{
          fontSize: 11,
          color: "var(--ink-3)",
          textAlign: "center",
          marginTop: 10,
          minHeight: 14,
        }}
      >
        {flash ? `Added "${flash}" ✓` : "Tap to log in one tap"}
      </div>
    </div>
  );
}

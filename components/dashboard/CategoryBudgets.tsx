"use client";

import { useState } from "react";
import { useCurrency } from "@/lib/currency";
import { CATEGORIES_OPTIONS } from "@/lib/dashboard-data";
import { IconCheck, IconClose, IconPlus } from "@/lib/icons";

const EXPENSE_CATEGORIES = CATEGORIES_OPTIONS.filter(
  (c) => c.key !== "Income" && c.key !== "Transfer",
);

type Props = {
  spendByCat: Record<string, number>;
  budgets: Record<string, number>;
  onSave: (next: Record<string, number>) => Promise<void> | void;
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid var(--accent)",
  outline: "none",
  fontSize: 13,
  fontFamily: "var(--font-display)",
};

export default function CategoryBudgets({ spendByCat, budgets, onSave }: Props) {
  const { fmt, sym, rate } = useCurrency();
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [addCat, setAddCat] = useState("");
  const [addAmount, setAddAmount] = useState("");

  const rows = Object.entries(budgets)
    .map(([cat, budget]) => {
      const spent = spendByCat[cat] || 0;
      const pct = budget > 0 ? (spent / budget) * 100 : 0;
      const meta = CATEGORIES_OPTIONS.find((c) => c.key === cat);
      return { cat, budget, spent, pct, color: meta ? meta.color : "oklch(0.60 0.02 280)" };
    })
    .sort((a, b) => b.pct - a.pct);

  const uncapped = EXPENSE_CATEGORIES.filter((c) => !(c.key in budgets));

  const startEdit = (cat: string, budget: number) => {
    setEditingCat(cat);
    setDraft(String(Math.round(budget * rate * 100) / 100));
  };

  const saveEdit = () => {
    if (!editingCat) return;
    const v = parseFloat(draft);
    if (isFinite(v) && v > 0) {
      onSave({ ...budgets, [editingCat]: v / rate });
    }
    setEditingCat(null);
  };

  const removeCap = (cat: string) => {
    const next = { ...budgets };
    delete next[cat];
    onSave(next);
    if (editingCat === cat) setEditingCat(null);
  };

  const saveAdd = () => {
    const v = parseFloat(addAmount);
    if (!addCat || !isFinite(v) || v <= 0) return;
    onSave({ ...budgets, [addCat]: v / rate });
    setAdding(false);
    setAddCat("");
    setAddAmount("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {rows.length === 0 && !adding && (
        <div style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.5 }}>
          No caps yet. Add one to see spending tracked against a per-category limit.
        </div>
      )}

      {rows.map((r) => {
        const over = r.spent > r.budget;
        const isEditing = editingCat === r.cat;
        return (
          <div key={r.cat}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 4,
                fontSize: 13,
                gap: 8,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: r.color, flexShrink: 0 }} />
                <span style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {r.cat}
                </span>
              </span>
              {isEditing ? (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input
                    type="number"
                    min={0}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit();
                      if (e.key === "Escape") setEditingCat(null);
                    }}
                    autoFocus
                    aria-label={`${r.cat} cap in ${sym}`}
                    style={{ ...inputStyle, width: 80, flex: "none" }}
                  />
                  <button
                    onClick={saveEdit}
                    aria-label={`Save ${r.cat} cap`}
                    className="btn btn--ink btn--sm"
                    style={{ padding: "5px 8px" }}
                  >
                    <IconCheck size={12} />
                  </button>
                  <button
                    onClick={() => removeCap(r.cat)}
                    aria-label={`Remove ${r.cat} cap`}
                    title="Remove cap"
                    className="btn btn--ghost btn--sm"
                    style={{ padding: "5px 8px", color: "var(--neg)" }}
                  >
                    <IconClose size={12} />
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => startEdit(r.cat, r.budget)}
                  aria-label={`Edit ${r.cat} cap`}
                  title="Edit cap"
                  className="num"
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    padding: 0,
                    color: over ? "var(--neg)" : "var(--ink-3)",
                    fontSize: 12,
                    textDecoration: "underline dotted",
                    textUnderlineOffset: 3,
                  }}
                >
                  {fmt(r.spent, { short: true })} / {fmt(r.budget, { short: true })}
                </button>
              )}
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
                  width: `${Math.min(100, r.pct)}%`,
                  height: "100%",
                  background: over ? "var(--neg)" : r.color,
                  borderRadius: 999,
                  transition: "width .3s ease",
                }}
              />
            </div>
          </div>
        );
      })}

      {adding ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <select
            value={addCat}
            onChange={(e) => setAddCat(e.target.value)}
            aria-label="Category to cap"
            style={{ ...inputStyle, border: "1px solid var(--line)", flex: 1 }}
          >
            <option value="" disabled>
              Category…
            </option>
            {uncapped.map((c) => (
              <option key={c.key} value={c.key}>
                {c.key}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            value={addAmount}
            onChange={(e) => setAddAmount(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveAdd();
              if (e.key === "Escape") setAdding(false);
            }}
            placeholder={sym}
            aria-label={`Cap amount in ${sym}`}
            style={{ ...inputStyle, width: 72, flex: "none" }}
          />
          <button
            onClick={saveAdd}
            aria-label="Save new cap"
            className="btn btn--ink btn--sm"
            style={{ padding: "5px 8px" }}
          >
            <IconCheck size={12} />
          </button>
          <button
            onClick={() => setAdding(false)}
            aria-label="Cancel new cap"
            className="btn btn--ghost btn--sm"
            style={{ padding: "5px 8px" }}
          >
            <IconClose size={12} />
          </button>
        </div>
      ) : (
        uncapped.length > 0 && (
          <button
            onClick={() => setAdding(true)}
            style={{
              padding: "10px",
              border: "1px dashed var(--line)",
              borderRadius: 10,
              background: "transparent",
              color: "var(--ink-3)",
              fontSize: 12,
              textAlign: "center",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontFamily: "inherit",
            }}
          >
            <IconPlus size={13} /> Add cap
          </button>
        )
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useCurrency } from "@/lib/currency";
import { CATEGORIES_OPTIONS, type TransactionInput } from "@/lib/dashboard-data";
import {
  IconArrowDown,
  IconArrowUp,
  IconClose,
  IconPlus,
} from "@/lib/icons";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (t: TransactionInput) => Promise<void> | void;
};

export default function AddTransactionModal({ open, onClose, onAdd }: Props) {
  const { sym, rate } = useCurrency();
  const today = new Date().toISOString().slice(0, 10);
  const [type, setType] = useState<"in" | "out">("out");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("Restaurants");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const reset = () => {
    setType("out");
    setAmount("");
    setTitle("");
    setMerchant("");
    setCategory("Restaurants");
    setDate(today);
    setNote("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const amt = parseFloat(amount);
    if (!amt || !title.trim()) return;
    const baseAmt = amt / rate;
    setSubmitting(true);
    try {
      await onAdd({
        type,
        title: title.trim(),
        sub: merchant.trim() || category,
        note: note.trim(),
        cat: category,
        amount: type === "in" ? Math.abs(baseAmt) : -Math.abs(baseAmt),
        date: new Date(date).toISOString(),
      });
      reset();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    padding: "11px 14px",
    borderRadius: 12,
    border: "1px solid var(--line)",
    background: "var(--surface-2)",
    fontSize: 14,
    outline: "none",
    width: "100%",
    fontFamily: "inherit",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,15,35,0.48)",
        backdropFilter: "blur(6px)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        style={{
          background: "var(--surface)",
          borderRadius: 28,
          width: "100%",
          maxWidth: 480,
          padding: 28,
          boxShadow: "var(--shadow-lg)",
          maxHeight: "92vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <div className="kicker">Log</div>
            <h3 className="display" style={{ fontSize: 24, fontWeight: 700, margin: "4px 0 0" }}>
              Add transaction
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--surface-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ink-2)",
            }}
          >
            <IconClose size={18} />
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            background: "var(--surface-2)",
            padding: 4,
            borderRadius: 999,
            marginBottom: 16,
          }}
        >
          {[
            { k: "out" as const, label: "Expense", icon: IconArrowDown, color: "oklch(0.52 0.19 25)" },
            { k: "in" as const,  label: "Income",  icon: IconArrowUp,   color: "oklch(0.48 0.17 155)" },
          ].map((t) => {
            const active = type === t.k;
            return (
              <button
                key={t.k}
                type="button"
                onClick={() => setType(t.k)}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 600,
                  background: active ? "var(--surface)" : "transparent",
                  color: active ? t.color : "var(--ink-3)",
                  boxShadow: active ? "var(--shadow-sm)" : "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <t.icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        <div
          style={{
            background:
              type === "in"
                ? "linear-gradient(135deg, color-mix(in oklch, var(--pos) 14%, white), color-mix(in oklch, var(--pos) 22%, white))"
                : "linear-gradient(135deg, var(--accent-soft), color-mix(in oklch, var(--accent) 18%, white))",
            borderRadius: 20,
            padding: "18px 20px",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: type === "in" ? "oklch(0.38 0.16 155)" : "var(--accent-ink)",
              fontWeight: 600,
            }}
          >
            Amount
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span
              className="num"
              style={{
                fontSize: 38,
                fontWeight: 700,
                color: type === "in" ? "oklch(0.38 0.16 155)" : "var(--accent-ink)",
              }}
            >
              {sym}
            </span>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              placeholder="0.00"
              className="num"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 38,
                fontWeight: 700,
                fontFamily: "var(--font-display)",
                color: type === "in" ? "oklch(0.38 0.16 155)" : "var(--accent-ink)",
                width: "100%",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span
              style={{
                fontSize: 11,
                color: "var(--ink-3)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 600,
              }}
            >
              Title
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly Groceries"
              style={fieldStyle}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--ink-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontWeight: 600,
                }}
              >
                Merchant / From
              </span>
              <input
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="Carrefour"
                style={fieldStyle}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--ink-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontWeight: 600,
                }}
              >
                Date
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={fieldStyle}
              />
            </label>
          </div>

          <div>
            <span
              style={{
                fontSize: 11,
                color: "var(--ink-3)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 600,
                display: "block",
                marginBottom: 8,
              }}
            >
              Category
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CATEGORIES_OPTIONS.map((c) => {
                const active = category === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(c.key)}
                    style={{
                      padding: "7px 12px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 500,
                      border: `1px solid ${active ? c.color : "var(--line)"}`,
                      background: active ? `color-mix(in oklch, ${c.color} 16%, white)` : "var(--surface)",
                      color: active ? c.color : "var(--ink-2)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: c.color }} />
                    {c.key}
                  </button>
                );
              })}
            </div>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span
              style={{
                fontSize: 11,
                color: "var(--ink-3)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 600,
              }}
            >
              Note (optional)
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Add a note…"
              style={{ ...fieldStyle, resize: "vertical", minHeight: 60 }}
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="btn btn--outline"
            style={{ flex: 1, justifyContent: "center", opacity: submitting ? 0.6 : 1 }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn--ink"
            style={{ flex: 2, justifyContent: "center", opacity: submitting ? 0.85 : 1 }}
            aria-busy={submitting}
          >
            {submitting ? (
              <>
                <span className="pb-spin" /> Saving…
              </>
            ) : (
              <>
                <IconPlus size={16} /> Add transaction
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

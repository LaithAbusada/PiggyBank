"use client";

import { useEffect, useState } from "react";
import { IconClose } from "@/lib/icons";
import { CATEGORIES_OPTIONS } from "@/lib/dashboard-data";

export type PromoteInput = {
  type: "in" | "out";
  title: string;
  cat: string;
  amount: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onPromote: (data: PromoteInput) => Promise<void>;
  pending: { id: string; raw: string; receivedAt: string } | null;
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--ink-3)",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  fontWeight: 600,
};

export default function PromotePendingModal({ open, onClose, onPromote, pending }: Props) {
  const [type, setType] = useState<"in" | "out">("out");
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState("Other");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType("out");
    setTitle("");
    setCat("Other");
    setAmount("");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !pending) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!isFinite(amt) || !title.trim()) return;
    setSubmitting(true);
    try {
      await onPromote({ type, title: title.trim(), cat, amount: amt });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid var(--line)",
    background: "var(--surface-2)",
    fontSize: 13,
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
          borderRadius: 24,
          width: "100%",
          maxWidth: 480,
          padding: 26,
          boxShadow: "var(--shadow-lg)",
          maxHeight: "92vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 14,
          }}
        >
          <div>
            <div className="kicker">Review</div>
            <h3 className="display" style={{ fontSize: 22, fontWeight: 700, margin: "4px 0 0" }}>
              Promote to transaction
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "var(--surface-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ink-2)",
            }}
          >
            <IconClose size={16} />
          </button>
        </div>

        <div
          style={{
            padding: 12,
            background: "var(--surface-2)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 12,
            color: "var(--ink-2)",
            whiteSpace: "pre-wrap",
            marginBottom: 16,
          }}
        >
          {pending.raw}
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={labelStyle}>Type</span>
            <select
              style={fieldStyle}
              value={type}
              onChange={(e) => setType(e.target.value as "in" | "out")}
            >
              <option value="out">Expense</option>
              <option value="in">Income</option>
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={labelStyle}>Title / merchant</span>
            <input
              style={fieldStyle}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="STARBUCKS"
            />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={labelStyle}>Amount</span>
              <input
                type="number"
                step="0.01"
                style={fieldStyle}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="25.00"
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={labelStyle}>Category</span>
              <select style={fieldStyle} value={cat} onChange={(e) => setCat(e.target.value)}>
                {CATEGORIES_OPTIONS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.key}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>
            </label>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn--outline"
            style={{ flex: 1, justifyContent: "center" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn--ink"
            disabled={submitting}
            style={{ flex: 1, justifyContent: "center" }}
          >
            {submitting ? "Saving…" : "Promote"}
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { IconClose } from "@/lib/icons";
import { CATEGORIES_OPTIONS } from "@/lib/dashboard-data";

export type CategoryAliasData = {
  id?: string;
  keyword: string;
  category: string;
  priority: number;
  active: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: CategoryAliasData) => Promise<void>;
  initial?: CategoryAliasData;
};

const empty: CategoryAliasData = {
  keyword: "",
  category: "Restaurants",
  priority: 0,
  active: true,
};

export default function CategoryAliasModal({ open, onClose, onSave, initial }: Props) {
  const [data, setData] = useState<CategoryAliasData>(empty);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setData(initial ?? empty);
    setErr(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, initial, onClose]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!data.keyword.trim()) return setErr("Keyword required");
    if (!data.category.trim()) return setErr("Category required");
    setSubmitting(true);
    setErr(null);
    try {
      await onSave({ ...data, keyword: data.keyword.trim(), category: data.category.trim() });
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save");
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
  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: "var(--ink-3)",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    fontWeight: 600,
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
          maxWidth: 460,
          padding: 26,
          boxShadow: "var(--shadow-lg)",
          maxHeight: "92vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div className="kicker">Automation</div>
            <h3 className="display" style={{ fontSize: 22, fontWeight: 700, margin: "4px 0 0" }}>
              {initial ? "Edit alias" : "New category alias"}
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

        <p style={{ fontSize: 12, color: "var(--ink-3)", margin: "0 0 14px", lineHeight: 1.55 }}>
          When an incoming SMS contains this keyword (case-insensitive), the parsed transaction will
          be tagged with the chosen category instead of the rule&rsquo;s default. Higher priority wins.
        </p>

        <div style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={labelStyle}>Keyword</span>
            <input
              style={fieldStyle}
              value={data.keyword}
              onChange={(e) => setData({ ...data, keyword: e.target.value })}
              placeholder="CAREEM FOOD"
              autoFocus
            />
            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
              Matched as a substring against merchant text and the raw SMS.
            </span>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={labelStyle}>Category</span>
            <select
              style={fieldStyle}
              value={data.category}
              onChange={(e) => setData({ ...data, category: e.target.value })}
            >
              {CATEGORIES_OPTIONS.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.key}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={labelStyle}>Priority</span>
            <input
              type="number"
              style={fieldStyle}
              value={data.priority}
              onChange={(e) => setData({ ...data, priority: parseInt(e.target.value) || 0 })}
            />
            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>Higher wins first.</span>
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
            <input
              type="checkbox"
              checked={data.active}
              onChange={(e) => setData({ ...data, active: e.target.checked })}
            />
            Active
          </label>
        </div>

        {err && <div style={{ marginTop: 12, color: "oklch(0.5 0.2 25)", fontSize: 13 }}>{err}</div>}

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button type="button" onClick={onClose} className="btn btn--outline" style={{ flex: 1, justifyContent: "center" }}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn--ink"
            disabled={submitting}
            style={{ flex: 1, justifyContent: "center" }}
          >
            {submitting ? "Saving…" : initial ? "Save changes" : "Create alias"}
          </button>
        </div>
      </form>
    </div>
  );
}

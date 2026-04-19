"use client";

import { useState } from "react";
import { useCurrency } from "@/lib/currency";
import { IconArrowDown, IconArrowUp, IconClose } from "@/lib/icons";
import type { Transaction } from "@/lib/dashboard-data";

type Props = {
  t: Transaction;
  onRemove?: (id: string) => Promise<void> | void;
};

export default function TransactionRow({ t, onRemove }: Props) {
  const { fmt } = useCurrency();
  const [hover, setHover] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onRemove || removing) return;
    setRemoving(true);
    try {
      await onRemove(t.id);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div
      onMouseEnter={(e) => {
        setHover(true);
        e.currentTarget.style.background = "var(--surface-2)";
      }}
      onMouseLeave={(e) => {
        setHover(false);
        e.currentTarget.style.background = "transparent";
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 10px",
        borderRadius: 14,
        transition: "background .15s ease",
        cursor: "pointer",
        opacity: removing ? 0.5 : 1,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          flexShrink: 0,
          background:
            t.type === "in"
              ? "color-mix(in oklch, var(--pos) 16%, white)"
              : "color-mix(in oklch, var(--neg) 16%, white)",
          color: t.type === "in" ? "oklch(0.38 0.16 155)" : "oklch(0.40 0.18 25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {t.type === "in" ? <IconArrowUp size={18} /> : <IconArrowDown size={18} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{t.title}</div>
        <div
          style={{
            fontSize: 12,
            color: "var(--ink-3)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {t.sub} · {t.when}
        </div>
      </div>
      <div
        className="num"
        style={{
          fontWeight: 600,
          fontSize: 14,
          whiteSpace: "nowrap",
          color: t.type === "in" ? "oklch(0.48 0.17 155)" : "oklch(0.52 0.19 25)",
        }}
      >
        {t.type === "in" ? "+" : "-"}{fmt(Math.abs(t.amount))}
      </div>
      {onRemove && (
        <button
          onClick={handleRemove}
          disabled={removing}
          aria-label={`Remove ${t.title}`}
          title="Remove"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            color: "var(--ink-3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            opacity: hover || removing ? 1 : 0,
            transition: "opacity .15s ease, color .15s ease, border-color .15s ease",
            cursor: removing ? "default" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (removing) return;
            e.currentTarget.style.color = "var(--neg)";
            e.currentTarget.style.borderColor = "var(--neg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--ink-3)";
            e.currentTarget.style.borderColor = "var(--line)";
          }}
        >
          {removing ? <span className="pb-spin" style={{ width: 12, height: 12 }} /> : <IconClose size={14} />}
        </button>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { CURRENCIES, useCurrency } from "@/lib/currency";

export default function CurrencyPicker() {
  const { code, setCode } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: "7px 12px",
          borderRadius: 999,
          background: "var(--surface-2)",
          border: "1px solid var(--line)",
          fontSize: 12,
          fontWeight: 600,
          fontFamily: "var(--font-display)",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--ink-2)",
        }}
      >
        <span style={{ fontSize: 14 }}>{CURRENCIES[code].symbol}</span>
        <span>{code}</span>
        <span style={{ fontSize: 10, opacity: 0.6 }}>▾</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 60,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 16,
            boxShadow: "var(--shadow-lg)",
            padding: 6,
            minWidth: 200,
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          {Object.values(CURRENCIES).map((c) => (
            <button
              key={c.code}
              onClick={() => {
                setCode(c.code);
                setOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "8px 10px",
                borderRadius: 10,
                textAlign: "left",
                background: code === c.code ? "var(--accent-soft)" : "transparent",
                color: code === c.code ? "var(--accent-ink)" : "var(--ink)",
                fontSize: 13,
              }}
              onMouseEnter={(e) => {
                if (code !== c.code) e.currentTarget.style.background = "var(--surface-2)";
              }}
              onMouseLeave={(e) => {
                if (code !== c.code) e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ width: 32, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13 }}>{c.symbol}</span>
              <span style={{ flex: 1 }}>{c.name}</span>
              <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{c.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

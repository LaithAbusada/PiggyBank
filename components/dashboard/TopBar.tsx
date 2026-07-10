"use client";

import CurrencyPicker from "@/components/CurrencyPicker";
import { IconMenu } from "@/lib/icons";

export default function TopBar({
  onMenu,
  initial = "L",
}: {
  onMenu: () => void;
  initial?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 4px 20px" }}>
      <button
        className="pb-hamburger"
        onClick={onMenu}
        aria-label="Open menu"
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "var(--surface)",
          border: "1px solid var(--line)",
          display: "none",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconMenu size={20} />
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
        <CurrencyPicker />
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            overflow: "hidden",
            background: "linear-gradient(135deg, oklch(0.82 0.10 60), oklch(0.68 0.15 25))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 15,
            border: "2px solid var(--surface)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {initial}
        </div>
      </div>
    </div>
  );
}

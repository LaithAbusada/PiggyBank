"use client";

import type { ComponentType } from "react";
import CurrencyPicker from "@/components/CurrencyPicker";
import {
  IconBell,
  IconMenu,
  IconMessage,
  IconSearch,
} from "@/lib/icons";

function IconBadgeBtn({
  icon: Icon,
  count,
  tint,
}: {
  icon: ComponentType<{ size?: number }>;
  count: number;
  tint: string;
}) {
  return (
    <button
      style={{
        position: "relative",
        width: 44,
        height: 44,
        borderRadius: 12,
        background: "var(--surface)",
        border: "1px solid var(--line)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--ink-2)",
        transition: "background .15s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface)")}
    >
      <Icon size={18} />
      {count > 0 && (
        <span
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            minWidth: 18,
            height: 18,
            padding: "0 5px",
            borderRadius: 9,
            background: tint,
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid var(--surface)",
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flex: 1,
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-pill)",
          padding: "10px 18px",
          maxWidth: 420,
        }}
      >
        <IconSearch size={18} style={{ color: "var(--ink-3)" }} />
        <input
          placeholder="Search transactions, people, categories…"
          style={{
            border: "none",
            outline: "none",
            background: "transparent",
            width: "100%",
            fontSize: 14,
          }}
        />
        <span
          style={{
            fontSize: 11,
            color: "var(--ink-3)",
            fontFamily: "ui-monospace, monospace",
            padding: "2px 6px",
            background: "var(--surface-2)",
            borderRadius: 6,
          }}
        >
          ⌘K
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
        <CurrencyPicker />
        <IconBadgeBtn icon={IconMessage} count={3} tint="oklch(0.82 0.14 55)" />
        <IconBadgeBtn icon={IconBell} count={2} tint="oklch(0.72 0.16 275)" />
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

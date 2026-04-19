"use client";

import { IconPlus } from "@/lib/icons";

export default function AddFAB({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Add transaction"
      style={{
        position: "fixed",
        right: 24,
        bottom: 24,
        zIndex: 90,
        width: 60,
        height: 60,
        borderRadius: 999,
        background: "var(--ink)",
        color: "var(--bg)",
        boxShadow: "0 14px 30px rgba(24,20,50,0.28)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform .15s ease, box-shadow .15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px) scale(1.04)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0) scale(1)";
      }}
    >
      <IconPlus size={24} />
    </button>
  );
}

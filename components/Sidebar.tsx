"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand, IconBolt, IconHome, IconSettings } from "@/lib/icons";
import type { ComponentType } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
};

const navItems: NavItem[] = [
  { href: "/dashboard",             label: "Dashboard",   icon: IconHome },
  { href: "/dashboard/automations", label: "Automations", icon: IconBolt },
  { href: "/dashboard/settings",    label: "Settings",    icon: IconSettings },
];

type Props = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ mobileOpen = false, onClose }: Props) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(20,15,35,0.38)",
            zIndex: 49,
            backdropFilter: "blur(4px)",
          }}
        />
      )}
      <aside className={`pb-sidebar ${mobileOpen ? "open" : ""}`}>
        <div style={{ padding: "6px 12px 20px 12px" }}>
          <Brand size={26} subtitle="Finance Manager" />
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0 10px" }}>
          {navItems.map((n) => {
            const active =
              n.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(n.href);
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={onClose}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 16px",
                  borderRadius: "var(--r-pill)",
                  fontWeight: 500,
                  fontSize: 14,
                  textAlign: "left",
                  color: active ? "var(--accent-ink)" : "var(--ink-2)",
                  background: active ? "var(--accent-soft)" : "transparent",
                  transition: "background .15s ease, color .15s ease",
                }}
              >
                <Icon size={18} />
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

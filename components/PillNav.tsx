"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CurrencyPicker from "./CurrencyPicker";
import { PiggyNose } from "@/lib/icons";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/calculator", label: "Calculator" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function PillNav() {
  const pathname = usePathname();
  return (
    <nav className="pill-nav">
      <Link href="/" className="pill-nav__brand" style={{ cursor: "pointer" }}>
        <PiggyNose size={28} />
        <span>PiggyBank</span>
      </Link>
      <div className="pill-nav__links">
        {links.map((l) => {
          const active = l.href === "/" ? pathname === "/" : pathname === l.href;
          return (
            <Link key={l.href} href={l.href} className={active ? "active" : ""}>
              {l.label}
            </Link>
          );
        })}
        <CurrencyPicker />
      </div>
    </nav>
  );
}

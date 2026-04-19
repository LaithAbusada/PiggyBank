"use client";

import { useState, type ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/dashboard/TopBar";

export default function DashboardShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useUser();
  const initial = (user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? "L").toUpperCase();

  return (
    <div className="pb-dash">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main className="pb-dash__main">
        <TopBar onMenu={() => setMobileOpen(true)} initial={initial} />
        {children}
      </main>
    </div>
  );
}

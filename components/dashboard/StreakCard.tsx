"use client";

import type { Transaction } from "@/lib/dashboard-data";

export default function StreakCard({ txns }: { txns: Transaction[] }) {
  const days = 14;
  const today = new Date();
  const set = new Set<string>();
  txns.forEach((t) => {
    const d = t._dateISO || new Date().toISOString().slice(0, 10);
    set.add(d);
  });
  const dots: { key: string; logged: boolean }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dots.push({ key, logged: set.has(key) });
  }
  let streak = 0;
  for (let i = dots.length - 1; i >= 0; i--) {
    if (dots[i].logged) streak++;
    else break;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 22 }}>🔥</div>
          <div className="display" style={{ fontSize: 24, fontWeight: 700, marginTop: 2 }}>
            {streak} day{streak === 1 ? "" : "s"}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)" }}>logging streak</div>
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-3)", textAlign: "right" }}>Last 14 days</div>
      </div>
      <div style={{ display: "flex", gap: 3 }}>
        {dots.map((d) => (
          <div
            key={d.key}
            style={{
              flex: 1,
              height: 28,
              borderRadius: 5,
              background: d.logged ? "var(--accent)" : "var(--line-2)",
              opacity: d.logged ? 1 : 0.6,
            }}
            title={d.key}
          />
        ))}
      </div>
    </div>
  );
}

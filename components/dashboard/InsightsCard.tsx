"use client";

import { useState } from "react";
import {
  IconBolt,
  IconCategory,
  IconSparkle,
  IconTrendDown,
  IconTrendUp,
  IconWallet,
} from "@/lib/icons";
import type { Insight, InsightIcon, InsightTone } from "@/lib/insights";

const ICONS: Record<InsightIcon, (p: { size?: number }) => React.ReactElement> = {
  trendUp: IconTrendUp,
  trendDown: IconTrendDown,
  sparkle: IconSparkle,
  bolt: IconBolt,
  wallet: IconWallet,
  category: IconCategory,
};

const TONE_STYLES: Record<InsightTone, { bg: string; border: string; ink: string; iconBg: string; iconInk: string; statBg: string }> = {
  good: {
    bg: "color-mix(in oklch, var(--pos) 6%, var(--surface))",
    border: "color-mix(in oklch, var(--pos) 30%, var(--line))",
    ink: "oklch(0.30 0.14 155)",
    iconBg: "color-mix(in oklch, var(--pos) 18%, white)",
    iconInk: "oklch(0.38 0.16 155)",
    statBg: "color-mix(in oklch, var(--pos) 22%, white)",
  },
  warn: {
    bg: "color-mix(in oklch, var(--neg) 5%, var(--surface))",
    border: "color-mix(in oklch, var(--neg) 28%, var(--line))",
    ink: "oklch(0.34 0.18 25)",
    iconBg: "color-mix(in oklch, var(--neg) 16%, white)",
    iconInk: "oklch(0.42 0.18 25)",
    statBg: "color-mix(in oklch, var(--neg) 20%, white)",
  },
  neutral: {
    bg: "var(--accent-soft)",
    border: "color-mix(in oklch, var(--accent) 20%, var(--line))",
    ink: "var(--accent-ink)",
    iconBg: "color-mix(in oklch, var(--accent) 18%, white)",
    iconInk: "var(--accent-ink)",
    statBg: "color-mix(in oklch, var(--accent) 20%, white)",
  },
};

export default function InsightsCard({ insights }: { insights: Insight[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? insights : insights.slice(0, 3);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div>
          <h3 className="display" style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            Insights
          </h3>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
            {insights.length === 0 ? "Nothing yet" : `${insights.length} signal${insights.length === 1 ? "" : "s"} from your log`}
          </div>
        </div>
        <span
          className="chip chip--accent"
          style={{ fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          <IconSparkle size={11} /> Auto
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {visible.map((ins) => {
          const Icon = ICONS[ins.icon];
          const tone = TONE_STYLES[ins.tone];
          return (
            <div
              key={ins.id}
              style={{
                display: "flex",
                gap: 10,
                padding: 12,
                borderRadius: 14,
                background: tone.bg,
                border: `1px solid ${tone.border}`,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: tone.iconBg,
                  color: tone.iconInk,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={15} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: tone.ink,
                      lineHeight: 1.3,
                    }}
                  >
                    {ins.title}
                  </div>
                  {ins.stat && (
                    <span
                      className="num"
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: tone.ink,
                        padding: "2px 7px",
                        borderRadius: 999,
                        background: tone.statBg,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {ins.stat}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 4, lineHeight: 1.4 }}>
                  {ins.body}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {insights.length > 3 && (
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => setExpanded((v) => !v)}
          style={{ marginTop: 10, width: "100%", justifyContent: "center" }}
        >
          {expanded ? "Show fewer" : `Show ${insights.length - 3} more`}
        </button>
      )}
    </div>
  );
}

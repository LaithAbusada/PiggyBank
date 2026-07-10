"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useCurrency } from "@/lib/currency";
import { monthLabel, type MonthRef } from "@/lib/dashboard-data";
import { IconSparkle } from "@/lib/icons";

type Tone = "good" | "bad" | "neutral";

type AiInsightsResult = {
  month: string;
  overview: string;
  highlights: { tone: Tone; title: string; detail: string }[];
  suggestions: string[];
  generatedAt: string;
};

type Props = {
  month: MonthRef;
  statsHash: string;
};

const TONE_STYLES: Record<Tone, { bg: string; border: string; ink: string }> = {
  good: {
    bg: "color-mix(in oklch, var(--pos) 6%, var(--surface))",
    border: "color-mix(in oklch, var(--pos) 30%, var(--line))",
    ink: "oklch(0.30 0.14 155)",
  },
  bad: {
    bg: "color-mix(in oklch, var(--neg) 5%, var(--surface))",
    border: "color-mix(in oklch, var(--neg) 28%, var(--line))",
    ink: "oklch(0.34 0.18 25)",
  },
  neutral: {
    bg: "color-mix(in oklch, var(--info) 6%, var(--surface))",
    border: "color-mix(in oklch, var(--info) 28%, var(--line))",
    ink: "oklch(0.34 0.13 275)",
  },
};

const Spinner = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="var(--line)" strokeWidth="3" />
    <path d="M12 3a9 9 0 019 9" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round">
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 12 12"
        to="360 12 12"
        dur="0.9s"
        repeatCount="indefinite"
      />
    </path>
  </svg>
);

export default function AiInsightsCard({ month, statsHash }: Props) {
  const { user } = useUser();
  const { code } = useCurrency();
  const userId = user?.id ?? null;
  const monthKey = `${month.year}-${String(month.month + 1).padStart(2, "0")}`;
  // Cache is user- and currency-scoped (the analysis text embeds amounts in the
  // display currency); until Clerk resolves the user, skip reading/writing it.
  const cacheKey = userId ? `pb_ai_insights_${userId}_${monthKey}_${code}` : null;
  const requestKey = `${userId ?? "?"}:${monthKey}:${code}`;

  const [result, setResult] = useState<AiInsightsResult | null>(null);
  const [cachedHash, setCachedHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const keyRef = useRef(requestKey);

  useEffect(() => {
    keyRef.current = requestKey;
    setResult(null);
    setCachedHash(null);
    setLoading(false);
    setError(null);
    setNotConfigured(false);
    if (!cacheKey) return;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { statsHash?: string; result?: AiInsightsResult };
        if (parsed && parsed.result) {
          setResult(parsed.result);
          setCachedHash(typeof parsed.statsHash === "string" ? parsed.statsHash : null);
        }
      }
    } catch {}
  }, [requestKey, cacheKey]);

  const stale = result != null && cachedHash != null && cachedHash !== statsHash;

  const generate = async () => {
    const key = requestKey;
    const storageKey = cacheKey;
    setLoading(true);
    setError(null);
    setNotConfigured(false);
    try {
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: monthKey,
          tzOffsetMin: -new Date().getTimezoneOffset(),
          currency: code,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (res.status === 503 && body?.error === "AI_NOT_CONFIGURED") {
          if (keyRef.current === key) setNotConfigured(true);
          return;
        }
        const msg = body?.error
          ? `Analysis failed: ${body.error}`
          : "Analysis failed. Give it another try.";
        if (keyRef.current === key) setError(msg);
        return;
      }
      const data = (await res.json()) as AiInsightsResult;
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify({ statsHash, result: data }));
        } catch {}
      }
      if (keyRef.current === key) {
        setResult(data);
        setCachedHash(statsHash);
      }
    } catch {
      if (keyRef.current === key) {
        setError("Couldn't reach the analysis service. Check your connection and retry.");
      }
    } finally {
      if (keyRef.current === key) setLoading(false);
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3 className="display" style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
            AI analysis
          </h3>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
            A written read on {monthLabel(month)}
          </div>
        </div>
        <button
          className="btn btn--ink btn--sm"
          onClick={generate}
          disabled={loading}
          style={loading ? { opacity: 0.6, cursor: "wait" } : undefined}
        >
          <IconSparkle size={14} /> {result ? "Regenerate" : "Generate"}
        </button>
      </div>

      {loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "18px 0",
            color: "var(--ink-3)",
            fontSize: 13,
          }}
        >
          <Spinner /> Analyzing your month...
        </div>
      )}

      {!loading && notConfigured && (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            border: "1px dashed var(--line)",
            background: "var(--surface-2)",
            fontSize: 13,
            color: "var(--ink-2)",
            lineHeight: 1.5,
          }}
        >
          AI analysis is not configured — add ANTHROPIC_API_KEY to .env.local (and Vercel) to enable.
        </div>
      )}

      {!loading && error && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "var(--neg)" }}>{error}</span>
          <button className="btn btn--ghost btn--sm" onClick={generate}>
            Retry
          </button>
        </div>
      )}

      {!loading && !notConfigured && !error && !result && (
        <div style={{ padding: "6px 0", color: "var(--ink-3)", fontSize: 13, lineHeight: 1.5 }}>
          Generate a plain-language summary of {monthLabel(month)} — what stood out, what changed,
          and a few things worth doing next.
        </div>
      )}

      {!loading && result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {stale && (
            <div
              style={{
                fontSize: 12,
                color: "var(--accent-ink)",
                background: "var(--accent-soft)",
                borderRadius: 10,
                padding: "8px 10px",
              }}
            >
              Data has changed — regenerate for fresh analysis.
            </div>
          )}

          <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0, color: "var(--ink)" }}>
            {result.overview}
          </p>

          {result.highlights.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {result.highlights.map((h, i) => {
                const tone = TONE_STYLES[h.tone] ?? TONE_STYLES.neutral;
                return (
                  <div
                    key={i}
                    style={{
                      padding: 12,
                      borderRadius: 14,
                      background: tone.bg,
                      border: `1px solid ${tone.border}`,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: tone.ink, lineHeight: 1.3 }}>
                      {h.title}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 4, lineHeight: 1.4 }}>
                      {h.detail}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {result.suggestions.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ink-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontWeight: 600,
                  marginTop: 2,
                }}
              >
                Suggestions
              </div>
              {result.suggestions.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    padding: "10px 12px",
                    borderRadius: 14,
                    background: "var(--surface-2)",
                    border: "1px solid var(--line)",
                  }}
                >
                  <span
                    className="num"
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "var(--accent-soft)",
                      color: "var(--accent-ink)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11.5,
                      fontWeight: 700,
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>{s}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
            Generated {new Date(result.generatedAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </div>
        </div>
      )}
    </div>
  );
}

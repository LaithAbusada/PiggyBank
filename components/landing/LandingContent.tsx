"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCurrency } from "@/lib/currency";
import {
  IconArrowRight,
  IconCheck,
  IconCategory,
  IconSparkle,
  IconTrendUp,
  IconBolt,
  IconWallet,
  PiggyNose,
} from "@/lib/icons";
import { WEEKDAYS } from "@/lib/dashboard-data";
import BarChart from "@/components/dashboard/BarChart";

function LandingFeature({
  title,
  body,
  chip,
  viz,
}: {
  title: string;
  body: ReactNode;
  chip: string;
  viz: ReactNode;
}) {
  return (
    <div
      className="card card--hover"
      style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, height: "100%" }}
    >
      <div>
        <span className="chip chip--accent" style={{ marginBottom: 12 }}>{chip}</span>
        <h3 className="display" style={{ fontSize: 22, fontWeight: 600, margin: "10px 0 8px" }}>{title}</h3>
        <p style={{ color: "var(--ink-2)", fontSize: 14, margin: 0, lineHeight: 1.55 }}>{body}</p>
      </div>
      <div style={{ marginTop: "auto" }}>{viz}</div>
    </div>
  );
}

export default function LandingContent() {
  const { fmt } = useCurrency();

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "0 20px 96px" }}>
      {/* HERO */}
      <section style={{ padding: "80px 0 64px", textAlign: "center" }}>
        <span className="chip chip--accent" style={{ marginBottom: 20 }}>
          <IconSparkle size={13} /> Plain-English insights, built in
        </span>
        <h1
          className="display"
          style={{
            fontSize: "clamp(44px, 6vw, 76px)",
            fontWeight: 700,
            margin: "0 auto",
            maxWidth: 860,
            lineHeight: 1.02,
          }}
        >
          Track what you spend. <span style={{ color: "var(--accent-deep)" }}>Actually read</span> what it means.
        </h1>
        <p
          style={{
            fontSize: "clamp(16px, 1.5vw, 19px)",
            color: "var(--ink-2)",
            maxWidth: 640,
            margin: "24px auto 36px",
            lineHeight: 1.55,
          }}
        >
          A small, fast personal finance app. Log your money, set a monthly jar, and get short
          plain-English insights about where it went — no bank connection, no spreadsheets.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/signup" className="btn btn--ink btn--lg">
            Start tracking <IconArrowRight size={18} />
          </Link>
          <Link href="/dashboard" className="btn btn--outline btn--lg">
            See the dashboard
          </Link>
        </div>
        <div
          style={{
            marginTop: 28,
            display: "flex",
            gap: 24,
            justifyContent: "center",
            flexWrap: "wrap",
            fontSize: 13,
            color: "var(--ink-3)",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <IconCheck size={14} /> Free to use
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <IconCheck size={14} /> Works in any currency
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <IconCheck size={14} /> No card required
          </span>
        </div>
      </section>

      {/* HERO MOCKUP */}
      <section style={{ marginBottom: 80 }}>
        <div
          style={{
            background: "linear-gradient(145deg, oklch(0.96 0.03 310), oklch(0.94 0.04 55))",
            borderRadius: 32,
            padding: 28,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 22,
              padding: 24,
              boxShadow: "0 30px 60px rgba(24,20,50,0.14)",
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gap: 18,
              alignItems: "start",
            }}
          >
            <div style={{ gridColumn: "span 4" }}>
              <div className="kicker" style={{ marginBottom: 10 }}>Net this month</div>
              <div className="num" style={{ fontSize: 42, fontWeight: 600 }}>{fmt(1242.18)}</div>
              <div className="chip chip--pos" style={{ marginTop: 10 }}>
                <IconTrendUp size={12} /> Ahead of pace
              </div>
            </div>
            <div style={{ gridColumn: "span 5" }}>
              <div className="kicker" style={{ marginBottom: 10 }}>Cashflow · last 7 days</div>
              <BarChart values={[1840, 2120, 2573, 1960, 2410, 2680, 2573]} labels={WEEKDAYS} color="var(--accent)" height={84} />
            </div>
            <div style={{ gridColumn: "span 3" }}>
              <div className="kicker" style={{ marginBottom: 10 }}>Top categories</div>
              {[
                { n: "Restaurants", p: 65 },
                { n: "Transport", p: 92 },
                { n: "Groceries", p: 42 },
              ].map((c) => (
                <div key={c.n} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span>{c.n}</span>
                    <span style={{ color: "var(--ink-3)" }}>{c.p}%</span>
                  </div>
                  <div style={{ height: 5, background: "var(--line-2)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${c.p}%`, height: "100%", background: "var(--accent)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "18px 8px 0",
              color: "var(--ink-2)",
            }}
          >
            <div style={{ fontSize: 12, fontFamily: "ui-monospace, monospace", letterSpacing: "0.06em" }}>
              dashboard preview
            </div>
            <div style={{ fontSize: 12 }}>Live preview → click &ldquo;Dashboard&rdquo; above</div>
          </div>
        </div>
      </section>

      {/* FEATURE GRID */}
      <section style={{ marginBottom: 80 }}>
        <div style={{ maxWidth: 620, marginBottom: 36 }}>
          <span className="kicker">What it actually does</span>
          <h2
            className="display"
            style={{ fontSize: "clamp(30px, 4vw, 44px)", fontWeight: 700, margin: "10px 0 0" }}
          >
            Small habits. Clear picture.
          </h2>
          <p style={{ color: "var(--ink-2)", fontSize: 15, margin: "14px 0 0", lineHeight: 1.6 }}>
            Everything here is built and working — no waitlists, no &ldquo;coming soon&rdquo; tags.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 16 }}>
          <LandingFeature
            chip="01 · Log"
            title="Add an expense in seconds"
            body="Amount, title, category, done. Quick-add tiles for your usual suspects — coffee, lunch, groceries, fuel — so one tap logs the whole thing."
            viz={
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                {[
                  { e: "☕", l: "Coffee" },
                  { e: "🥙", l: "Lunch" },
                  { e: "🛒", l: "Groceries" },
                  { e: "⛽", l: "Fuel" },
                  { e: "🚕", l: "Taxi" },
                  { e: "🍫", l: "Snack" },
                ].map((p) => (
                  <div
                    key={p.l}
                    style={{
                      padding: "8px 6px",
                      borderRadius: 10,
                      background: "var(--surface-2)",
                      border: "1px solid var(--line)",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 16 }}>{p.e}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-2)", marginTop: 2 }}>{p.l}</div>
                  </div>
                ))}
              </div>
            }
          />
          <LandingFeature
            chip="02 · Recurring"
            title="Set salary and rent once"
            body="Pick a day of the month and the entry posts itself — salary on the 25th, rent on the 1st, subscriptions whenever. Edit or remove any time."
            viz={
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { t: "Salary", d: "25th", amt: "+2.4k", tone: "pos" as const },
                  { t: "Rent", d: "1st", amt: "-650", tone: "neg" as const },
                  { t: "Netflix", d: "15th", amt: "-14", tone: "neg" as const },
                ].map((r) => (
                  <div
                    key={r.t}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 10px",
                      borderRadius: 10,
                      background: "var(--surface-2)",
                      fontSize: 12,
                    }}
                  >
                    <span>
                      <strong>{r.t}</strong>
                      <span style={{ color: "var(--ink-3)", marginLeft: 6 }}>{r.d}</span>
                    </span>
                    <span
                      className="num"
                      style={{
                        fontWeight: 700,
                        color: r.tone === "pos" ? "var(--pos)" : "var(--ink)",
                      }}
                    >
                      {r.amt}
                    </span>
                  </div>
                ))}
              </div>
            }
          />
          <LandingFeature
            chip="03 · Budget"
            title="One jar for the month"
            body="Set a monthly cap and per-category limits. The jar fills as you spend. Nothing gets blocked — you just see where you are."
            viz={
              <div>
                {[
                  { n: "Restaurants", p: 65, c: "oklch(0.55 0.20 295)" },
                  { n: "Transport", p: 92, c: "oklch(0.70 0.18 145)" },
                  { n: "Groceries", p: 42, c: "oklch(0.68 0.15 155)" },
                ].map((c) => (
                  <div key={c.n} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span>{c.n}</span>
                      <span style={{ color: "var(--ink-3)" }}>{c.p}%</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 999, background: "var(--line-2)", overflow: "hidden" }}>
                      <div style={{ width: `${c.p}%`, height: "100%", background: c.c, borderRadius: 999 }} />
                    </div>
                  </div>
                ))}
              </div>
            }
          />
          <LandingFeature
            chip="04 · Insights"
            title="Plain-English nudges"
            body={`"You're ${fmt(94, { short: true })} above last month's same stretch." Short, specific, tied to what you actually logged. No AI chatbot, no guessing.`}
            viz={
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  padding: 12,
                  background: "var(--accent-soft)",
                  borderRadius: 14,
                  color: "var(--accent-ink)",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 9,
                    background: "color-mix(in oklch, var(--accent) 20%, white)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <IconTrendUp size={14} />
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.4 }}>
                  <div style={{ fontWeight: 600 }}>Spending faster than usual</div>
                  <div style={{ marginTop: 2, color: "var(--ink-2)" }}>
                    On pace for {fmt(1820, { short: true })} vs your {fmt(1500, { short: true })} cap.
                  </div>
                </div>
              </div>
            }
          />
          <LandingFeature
            chip="05 · Streak"
            title="Keep the habit"
            body="A light counter rewards logging every day. Miss a day, no shame — pick it back up tomorrow. Most people quit finance apps in week two; this helps."
            viz={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 14,
                  borderRadius: 14,
                  background: "color-mix(in oklch, var(--warn) 14%, white)",
                  color: "oklch(0.38 0.13 75)",
                }}
              >
                <div style={{ fontSize: 30 }}>🔥</div>
                <div>
                  <div className="num" style={{ fontSize: 22, fontWeight: 700 }}>12 days</div>
                  <div style={{ fontSize: 11, color: "var(--ink-2)" }}>Logging streak</div>
                </div>
              </div>
            }
          />
          <LandingFeature
            chip="06 · Charts"
            title="Cashflow you can actually read"
            body="Thirty-day area chart for in vs out, a donut for where the month went by category, and a searchable transaction list. That's it. No 40-tab accounting UI."
            viz={
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {[
                  { Icon: IconTrendUp, bg: "color-mix(in oklch, var(--pos) 16%, white)", c: "oklch(0.38 0.16 155)" },
                  { Icon: IconCategory, bg: "var(--accent-soft)", c: "var(--accent-ink)" },
                  { Icon: IconWallet, bg: "color-mix(in oklch, var(--warn) 16%, white)", c: "oklch(0.38 0.13 75)" },
                  { Icon: IconBolt, bg: "color-mix(in oklch, var(--neg) 14%, white)", c: "oklch(0.38 0.16 25)" },
                ].map(({ Icon, bg, c }, i) => (
                  <div
                    key={i}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: bg,
                      color: c,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={18} />
                  </div>
                ))}
              </div>
            }
          />
        </div>
      </section>

      {/* HONESTY SECTION */}
      <section style={{ marginBottom: 80 }}>
        <div
          className="card"
          style={{
            padding: "28px 32px",
            background: "var(--surface-2)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 24,
          }}
        >
          <div>
            <span className="kicker" style={{ color: "var(--accent-ink)" }}>What it isn&rsquo;t</span>
            <h3 className="display" style={{ fontSize: 22, fontWeight: 600, margin: "8px 0 0" }}>
              A few things we don&rsquo;t do.
            </h3>
            <p style={{ color: "var(--ink-2)", fontSize: 14, margin: "12px 0 0", lineHeight: 1.6 }}>
              There are apps that connect to your bank, auto-categorize with ML, and split bills
              with friends. This isn&rsquo;t one of them, and we&rsquo;re not going to pretend it is.
            </p>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "No bank account linking — you log entries yourself.",
              "No automatic categorization — you pick the bucket.",
              "No bill splitting with friends.",
              "No investment tracking or tax features.",
            ].map((t) => (
              <li
                key={t}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  fontSize: 14,
                  color: "var(--ink-2)",
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 6,
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    color: "var(--ink-3)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  ×
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          background: "var(--ink)",
          color: "var(--bg)",
          borderRadius: 32,
          padding: "56px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 32,
          flexWrap: "wrap",
        }}
      >
        <div style={{ maxWidth: 520 }}>
          <h2
            className="display"
            style={{ fontSize: "clamp(28px, 3.6vw, 40px)", fontWeight: 700, margin: 0, lineHeight: 1.05 }}
          >
            Your piggy bank, but with a brain.
          </h2>
          <p style={{ color: "oklch(0.82 0.02 280)", margin: "14px 0 0", fontSize: 16, maxWidth: 460 }}>
            Sign up, log a few things, and let the insights tell you what&rsquo;s actually going on.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/signup" className="btn btn--accent btn--lg">
            Start free <IconArrowRight size={18} />
          </Link>
          <Link href="/dashboard" className="btn btn--lg" style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}>
            See the dashboard
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          marginTop: 56,
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 18,
          color: "var(--ink-3)",
          fontSize: 13,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <PiggyNose size={22} />
          <span>© 2026 PiggyBank. Built with care in Amman.</span>
        </div>
        <div style={{ display: "flex", gap: 18 }}>
          <a href="#" style={{ color: "var(--ink-2)" }}>Privacy</a>
          <a href="#" style={{ color: "var(--ink-2)" }}>Terms</a>
        </div>
      </footer>
    </main>
  );
}

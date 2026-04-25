"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import { useCurrency } from "@/lib/currency";
import {
  CAT_BUDGETS,
  USER,
  dayLabels,
  deriveStats,
  fromDbTransaction,
  type Transaction,
  type TransactionInput,
} from "@/lib/dashboard-data";
import { IconArrowRight, IconPlus, IconSettings } from "@/lib/icons";
import AreaChart from "@/components/dashboard/AreaChart";
import DonutChart from "@/components/dashboard/DonutChart";
import SpendingBars from "@/components/dashboard/SpendingBars";
import TransactionRow from "@/components/dashboard/TransactionRow";
import BudgetJar from "@/components/dashboard/BudgetJar";
import QuickAdd from "@/components/dashboard/QuickAdd";
import MonthAtAGlance from "@/components/dashboard/MonthAtAGlance";
import StreakCard from "@/components/dashboard/StreakCard";
import CategoryBudgets from "@/components/dashboard/CategoryBudgets";
import GoalsDashlet from "@/components/dashboard/GoalsDashlet";
import RecurringCard, { type Recurring } from "@/components/dashboard/RecurringCard";
import AddFAB from "@/components/dashboard/AddFAB";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import InsightsCard from "@/components/dashboard/InsightsCard";
import { computeInsights } from "@/lib/insights";
import { RANGE_DAYS, RANGE_LABELS, useDashboardPrefs } from "@/lib/dashboard-prefs";
import type { RecurringInput } from "@/components/dashboard/AddRecurringModal";

const AddTransactionModal = dynamic(
  () => import("@/components/dashboard/AddTransactionModal"),
  { ssr: false },
);
const AddRecurringModal = dynamic(
  () => import("@/components/dashboard/AddRecurringModal"),
  { ssr: false },
);
const CustomizeDrawer = dynamic(
  () => import("@/components/dashboard/CustomizePanel").then((m) => m.CustomizeDrawer),
  { ssr: false },
);

const DEFAULT_BUDGET = 1500;

export default function DashboardPage() {
  const { fmt } = useCurrency();
  const { user } = useUser();
  const { prefs } = useDashboardPrefs();
  const [modalOpen, setModalOpen] = useState(false);
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [filter, setFilter] = useState<"All" | "Income" | "Expense">("All");
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [recurring, setRecurring] = useState<Recurring[]>([]);
  const [monthBudget, setMonthBudget] = useState(DEFAULT_BUDGET);
  const [loading, setLoading] = useState(true);

  const refetchTxns = async () => {
    const res = await fetch("/api/transactions");
    if (res.ok) {
      const rows = await res.json();
      setTxns(rows.map(fromDbTransaction));
    }
  };

  useEffect(() => {
    let cancelled = false;

    // Transactions drive the initial skeleton → render as soon as they arrive.
    fetch("/api/transactions")
      .then((r) => (r.ok ? r.json() : null))
      .then((rows) => {
        if (cancelled || !rows) return;
        setTxns(rows.map(fromDbTransaction));
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });

    // Budget + recurring populate independently — side rail updates when they land.
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => {
        if (cancelled || !me) return;
        if (typeof me.monthBudget === "number") setMonthBudget(me.monthBudget);
      })
      .catch(() => {});

    fetch("/api/recurring")
      .then((r) => (r.ok ? r.json() : null))
      .then((rows) => {
        if (cancelled || !rows) return;
        setRecurring(rows);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []);

  const addTxn = async (input: TransactionInput) => {
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) return;
    const row = await res.json();
    setTxns((prev) => [fromDbTransaction(row), ...prev]);
  };

  const removeTxn = async (id: string) => {
    const prev = txns;
    setTxns((curr) => curr.filter((t) => t.id !== id));
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (!res.ok) setTxns(prev);
  };

  const addRecurring = async (input: RecurringInput) => {
    const res = await fetch("/api/recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) return;
    const row = await res.json();
    setRecurring((prev) => [row, ...prev]);
    await refetchTxns();
  };

  const removeRecurring = async (id: string) => {
    const res = await fetch(`/api/recurring/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setRecurring((prev) => prev.filter((r) => r.id !== id));
  };

  const updateBudget = async (v: number) => {
    setMonthBudget(v);
    await fetch("/api/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthBudget: v }),
    });
  };

  const rangeDays = RANGE_DAYS[prefs.cashflowRange];
  const stats = useMemo(() => deriveStats(txns, rangeDays), [txns, rangeDays]);
  const labels = useMemo(() => dayLabels(rangeDays), [rangeDays]);
  const insights = useMemo(
    () => computeInsights({ txns, monthBudget, recurring, fmt }),
    [txns, monthBudget, recurring, fmt],
  );
  const { visible } = prefs;
  const anyRailVisible =
    visible.insights ||
    visible.budgetJar ||
    visible.quickLog ||
    visible.recurring ||
    visible.monthGlance ||
    visible.streak ||
    visible.catBudgets ||
    visible.goals;
  const filtered = txns.filter((t) =>
    filter === "All" ? true : filter === "Income" ? t.type === "in" : t.type === "out"
  );
  const net = stats.inc - stats.exp;
  const greetingName = user?.firstName ?? USER.first;

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <div className="kicker">Good afternoon, {greetingName}</div>
          <h1 className="display" style={{ fontSize: 28, fontWeight: 700, margin: "4px 0 0" }}>
            You&rsquo;re{" "}
            {net >= 0 ? (
              <span style={{ color: "var(--pos)" }}>+{fmt(net)}</span>
            ) : (
              <span style={{ color: "var(--neg)" }}>-{fmt(Math.abs(net))}</span>
            )}{" "}
            across {txns.length} transactions.
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            className="btn btn--outline btn--sm"
            onClick={() => setCustomizeOpen(true)}
            aria-label="Customize dashboard"
            title="Customize dashboard"
          >
            <IconSettings size={16} /> Customize
          </button>
          <button className="btn btn--ink" onClick={() => setModalOpen(true)}>
            <IconPlus size={16} /> Add transaction
          </button>
        </div>
      </div>

      <div
        className="pb-dash__grid"
        style={!anyRailVisible ? { gridTemplateColumns: "minmax(0, 1fr)" } : undefined}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {visible.cashflow && (
            <div className="card pb-card" style={{ padding: "var(--card-pad, 22px)" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 14,
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <div>
                  <h3 className="display" style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
                    Cashflow · {RANGE_LABELS[prefs.cashflowRange].toLowerCase()}
                  </h3>
                  <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 12 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--accent)" }} />
                      <span style={{ color: "var(--ink-3)" }}>Income</span>
                      <span className="num" style={{ fontWeight: 600 }}>
                        {fmt(stats.inc, { short: true })}
                      </span>
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          background: "oklch(0.66 0.21 25)",
                        }}
                      />
                      <span style={{ color: "var(--ink-3)" }}>Expense</span>
                      <span className="num" style={{ fontWeight: 600 }}>
                        {fmt(stats.exp, { short: true })}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="num" style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--ink-3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Net
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: net >= 0 ? "var(--pos)" : "var(--neg)",
                    }}
                  >
                    {net >= 0 ? "+" : "-"}{fmt(Math.abs(net), { short: true })}
                  </div>
                </div>
              </div>
              <AreaChart
                income={stats.incSeries}
                expense={stats.expSeries}
                labels={labels}
                mode={prefs.cashflowChart}
              />
            </div>
          )}

          {visible.spending && (
            <div className="card pb-card" style={{ padding: "var(--card-pad, 22px)" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <h3 className="display" style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
                  Where your money went
                </h3>
                <span className="chip">This month</span>
              </div>
              {stats.catSegments.length === 0 ? (
                <div style={{ padding: "20px 0", color: "var(--ink-3)", fontSize: 14 }}>
                  No expenses yet. Add one with the + button.
                </div>
              ) : prefs.spendingChart === "donut" ? (
                <DonutChart
                  segments={stats.catSegments}
                  centerLabel="Total spent"
                  centerValue={fmt(stats.exp, { short: true })}
                />
              ) : (
                <SpendingBars segments={stats.catSegments} total={stats.exp} />
              )}
            </div>
          )}

          {visible.transactions && (
            <div className="card pb-card" style={{ padding: "var(--card-pad, 22px)" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <h3 className="display" style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
                  All Transactions
                </h3>
                <div style={{ display: "flex", gap: 6 }}>
                  {(["All", "Income", "Expense"] as const).map((t) => (
                    <button
                      key={t}
                      className="btn btn--sm"
                      onClick={() => setFilter(t)}
                      style={{
                        background: filter === t ? "var(--ink)" : "var(--surface-2)",
                        color: filter === t ? "var(--bg)" : "var(--ink-2)",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                {filtered.length === 0 ? (
                  <div style={{ padding: "20px 0", color: "var(--ink-3)", fontSize: 14 }}>
                    Nothing here yet.
                  </div>
                ) : (
                  filtered.slice(0, 8).map((t) => (
                    <TransactionRow key={t.id} t={t} onRemove={removeTxn} />
                  ))
                )}
              </div>
              {filtered.length > 8 && (
                <button className="btn btn--ghost btn--sm" style={{ marginTop: 6 }}>
                  View all {filtered.length} transactions <IconArrowRight size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {anyRailVisible && (
          <aside className="pb-dash__rail">
            {visible.insights && (
              <div className="card pb-card" style={{ padding: "var(--card-pad-rail, 20px)" }}>
                <InsightsCard insights={insights} />
              </div>
            )}

            {visible.budgetJar && (
              <div className="card pb-card" style={{ padding: "var(--card-pad-rail, 20px)" }}>
                <div style={{ marginBottom: 14 }}>
                  <h3 className="display" style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                    Budget Jar
                  </h3>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>This month</div>
                </div>
                <BudgetJar spent={stats.monthSpent} budget={monthBudget} onSetBudget={updateBudget} />
              </div>
            )}

            {visible.quickLog && (
              <div className="card pb-card" style={{ padding: "var(--card-pad-rail, 20px)" }}>
                <div style={{ marginBottom: 12 }}>
                  <h3 className="display" style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                    Quick log
                  </h3>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
                    Your usual expenses
                  </div>
                </div>
                <QuickAdd onAdd={addTxn} />
              </div>
            )}

            {visible.recurring && (
              <div className="card pb-card" style={{ padding: "var(--card-pad-rail, 20px)" }}>
                <RecurringCard
                  items={recurring}
                  onAddClick={() => setRecurringModalOpen(true)}
                  onRemove={removeRecurring}
                />
              </div>
            )}

            {visible.monthGlance && (
              <div className="card pb-card" style={{ padding: "var(--card-pad-rail, 20px)" }}>
                <MonthAtAGlance
                  monthSpent={stats.monthSpent}
                  monthBudget={monthBudget}
                  daysElapsed={stats.daysElapsed}
                  daysInMonth={stats.daysInMonth}
                />
              </div>
            )}

            {visible.streak && (
              <div className="card pb-card" style={{ padding: "var(--card-pad-rail, 20px)" }}>
                <StreakCard txns={txns} />
              </div>
            )}

            {visible.catBudgets && (
              <div className="card pb-card" style={{ padding: "var(--card-pad-rail, 20px)" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 14,
                  }}
                >
                  <h3 className="display" style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                    Category budgets
                  </h3>
                  <span style={{ fontSize: 11, color: "var(--ink-3)" }}>This month</span>
                </div>
                <CategoryBudgets spendByCat={stats.spendByCat} budgets={CAT_BUDGETS} />
              </div>
            )}

            {visible.goals && (
              <div className="card pb-card" style={{ padding: "var(--card-pad-rail, 20px)" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 14,
                  }}
                >
                  <h3 className="display" style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                    Savings goals
                  </h3>
                  <button className="btn btn--ghost btn--sm">
                    <IconPlus size={14} />
                  </button>
                </div>
                <GoalsDashlet />
              </div>
            )}
          </aside>
        )}
      </div>

      <AddFAB onClick={() => setModalOpen(true)} />
      {modalOpen && (
        <AddTransactionModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onAdd={addTxn}
        />
      )}
      {recurringModalOpen && (
        <AddRecurringModal
          open={recurringModalOpen}
          onClose={() => setRecurringModalOpen(false)}
          onAdd={addRecurring}
        />
      )}
      {customizeOpen && (
        <CustomizeDrawer open={customizeOpen} onClose={() => setCustomizeOpen(false)} />
      )}
    </>
  );
}

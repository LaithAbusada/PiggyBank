"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import { useCurrency } from "@/lib/currency";
import {
  CAT_BUDGETS,
  USER,
  monthDayLabels,
  deriveStats,
  fromDbTransaction,
  currentMonth,
  shiftMonth,
  isSameMonth,
  isFutureMonth,
  monthLabel,
  type MonthRef,
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
import { useDashboardPrefs } from "@/lib/dashboard-prefs";
import type { RecurringInput } from "@/components/dashboard/AddRecurringModal";
import type { TransactionEditInitial } from "@/components/dashboard/AddTransactionModal";

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
  const { fmt, rate } = useCurrency();
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
  const [selectedMonth, setSelectedMonth] = useState<MonthRef>(() => currentMonth());
  const [showAllTxns, setShowAllTxns] = useState(false);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);

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

  const updateTxn = async (id: string, input: TransactionInput) => {
    const res = await fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) return;
    const row = await res.json();
    setTxns((prev) => prev.map((t) => (t.id === id ? fromDbTransaction(row) : t)));
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

  const stats = useMemo(() => deriveStats(txns, selectedMonth), [txns, selectedMonth]);
  const labels = useMemo(() => monthDayLabels(selectedMonth), [selectedMonth]);
  const pointLabels = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < stats.daysInMonth; i++) {
      const d = new Date(selectedMonth.year, selectedMonth.month, i + 1);
      out.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
    }
    return out;
  }, [selectedMonth, stats.daysInMonth]);
  const insights = useMemo(
    () => computeInsights({ txns, monthBudget, recurring, fmt, target: selectedMonth }),
    [txns, monthBudget, recurring, fmt, selectedMonth],
  );
  const isCurrentMonth = isSameMonth(selectedMonth, currentMonth());
  const canGoForward = !isCurrentMonth;
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
  const monthTxns = useMemo(
    () => txns.filter((t) => {
      if (!t._dateISO) return false;
      const d = new Date(t._dateISO);
      return d.getFullYear() === selectedMonth.year && d.getMonth() === selectedMonth.month;
    }),
    [txns, selectedMonth],
  );
  const filtered = monthTxns.filter((t) =>
    filter === "All" ? true : filter === "Income" ? t.type === "in" : t.type === "out"
  );
  const net = stats.inc - stats.exp;
  const greetingName = user?.firstName ?? USER.first;

  const editInitial: TransactionEditInitial | undefined = editingTxn
    ? {
        type: editingTxn.type,
        amount: Math.abs(editingTxn.amount) * rate,
        title: editingTxn.title,
        merchant: editingTxn.sub,
        category: editingTxn.cat,
        date: editingTxn._dateISO ?? new Date().toISOString().slice(0, 10),
        note: editingTxn.note ?? "",
      }
    : undefined;

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
            across {monthTxns.length} {isCurrentMonth ? "transactions this month" : `transactions in ${monthLabel(selectedMonth)}`}.
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div
            role="group"
            aria-label="Month selector"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: 4,
              borderRadius: 999,
              border: "1px solid var(--line)",
              background: "var(--surface-2)",
            }}
          >
            <button
              type="button"
              aria-label="Previous month"
              title="Previous month"
              onClick={() => {
                setSelectedMonth((m) => shiftMonth(m, -1));
                setShowAllTxns(false);
              }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                border: "none",
                background: "transparent",
                color: "var(--ink-2)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <IconArrowRight size={14} style={{ transform: "rotate(180deg)" }} />
            </button>
            <span
              className="num"
              style={{ fontSize: 13, fontWeight: 600, padding: "0 8px", minWidth: 110, textAlign: "center" }}
            >
              {monthLabel(selectedMonth)}
            </span>
            <button
              type="button"
              aria-label="Next month"
              title={canGoForward ? "Next month" : "Already at current month"}
              disabled={!canGoForward}
              onClick={() => {
                setSelectedMonth((m) => {
                  const next = shiftMonth(m, 1);
                  return isFutureMonth(next) ? m : next;
                });
                setShowAllTxns(false);
              }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                border: "none",
                background: "transparent",
                color: canGoForward ? "var(--ink-2)" : "var(--ink-3)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: canGoForward ? "pointer" : "not-allowed",
                opacity: canGoForward ? 1 : 0.45,
                fontFamily: "inherit",
              }}
            >
              <IconArrowRight size={14} />
            </button>
            {!isCurrentMonth && (
              <button
                type="button"
                onClick={() => {
                  setSelectedMonth(currentMonth());
                  setShowAllTxns(false);
                }}
                style={{
                  fontSize: 11,
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: "none",
                  background: "var(--ink)",
                  color: "var(--bg)",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Today
              </button>
            )}
          </div>
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
                    Cashflow · {monthLabel(selectedMonth)}
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
                pointLabels={pointLabels}
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
                  No expenses {isCurrentMonth ? "yet" : `in ${monthLabel(selectedMonth)}`}. Add one with the + button.
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
                <div>
                  <h3 className="display" style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
                    Transactions · {monthLabel(selectedMonth)}
                  </h3>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
                    Click a row to edit · category, amount, or date
                  </div>
                </div>
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
                    Nothing in {monthLabel(selectedMonth)} yet.
                  </div>
                ) : (
                  (showAllTxns ? filtered : filtered.slice(0, 8)).map((t) => (
                    <TransactionRow
                      key={t.id}
                      t={t}
                      onRemove={removeTxn}
                      onEdit={setEditingTxn}
                    />
                  ))
                )}
              </div>
              {filtered.length > 8 && (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  style={{ marginTop: 6 }}
                  onClick={() => setShowAllTxns((v) => !v)}
                >
                  {showAllTxns
                    ? <>Show fewer</>
                    : <>View all {filtered.length} transactions <IconArrowRight size={14} /></>}
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
                  target={selectedMonth}
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
      {editingTxn && editInitial && (
        <AddTransactionModal
          open={true}
          mode="edit"
          initial={editInitial}
          onClose={() => setEditingTxn(null)}
          onAdd={async (input) => {
            await updateTxn(editingTxn.id, input);
          }}
          onDelete={async () => {
            await removeTxn(editingTxn.id);
          }}
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

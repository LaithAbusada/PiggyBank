"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type WidgetKey =
  | "cashflow"
  | "spending"
  | "transactions"
  | "insights"
  | "budgetJar"
  | "quickLog"
  | "recurring"
  | "monthGlance"
  | "streak"
  | "catBudgets"
  | "goals";

export type CashflowChart = "area" | "line" | "bar";
export type SpendingChart = "donut" | "bar";
export type CashflowRange = "7d" | "30d" | "90d" | "ytd";
export type Density = "compact" | "cozy";

export const WIDGET_META: Record<WidgetKey, { label: string; hint: string; rail: boolean }> = {
  cashflow:     { label: "Cashflow chart",       hint: "Income vs. expense over your chosen range.", rail: false },
  spending:     { label: "Where your money went", hint: "Category breakdown for the month.",          rail: false },
  transactions: { label: "All transactions",     hint: "List with Income/Expense filters.",           rail: false },
  insights:     { label: "Insights",             hint: "Automated observations about your spending.", rail: true },
  budgetJar:    { label: "Budget Jar",           hint: "This month's budget vs. spent.",              rail: true },
  quickLog:     { label: "Quick log",            hint: "Shortcut buttons for usual expenses.",        rail: true },
  recurring:    { label: "Recurring",            hint: "Subscriptions and repeating items.",          rail: true },
  monthGlance:  { label: "Month at a glance",    hint: "Pacing against the month.",                   rail: true },
  streak:       { label: "Streak",               hint: "Days in a row you've logged activity.",       rail: true },
  catBudgets:   { label: "Category budgets",     hint: "Per-category spending vs. caps.",             rail: true },
  goals:        { label: "Savings goals",        hint: "Progress toward your saved targets.",         rail: true },
};

export const RANGE_LABELS: Record<CashflowRange, string> = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  ytd: "Year to date",
};

export const RANGE_DAYS: Record<CashflowRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  ytd: Math.max(1, Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86_400_000) + 1),
};

export type DashboardPrefs = {
  visible: Record<WidgetKey, boolean>;
  cashflowChart: CashflowChart;
  cashflowRange: CashflowRange;
  spendingChart: SpendingChart;
  density: Density;
};

export const DEFAULT_PREFS: DashboardPrefs = {
  visible: {
    cashflow: true,
    spending: true,
    transactions: true,
    insights: true,
    budgetJar: true,
    quickLog: true,
    recurring: true,
    monthGlance: true,
    streak: true,
    catBudgets: true,
    goals: true,
  },
  cashflowChart: "area",
  cashflowRange: "30d",
  spendingChart: "donut",
  density: "cozy",
};

const STORAGE_KEY = "pb_dashboard_prefs";

type Ctx = {
  prefs: DashboardPrefs;
  setPrefs: (next: Partial<DashboardPrefs>) => void;
  setVisible: (key: WidgetKey, v: boolean) => void;
  reset: () => void;
};

const DashboardPrefsCtx = createContext<Ctx>({
  prefs: DEFAULT_PREFS,
  setPrefs: () => {},
  setVisible: () => {},
  reset: () => {},
});

function mergePrefs(stored: unknown): DashboardPrefs {
  if (!stored || typeof stored !== "object") return DEFAULT_PREFS;
  const s = stored as Partial<DashboardPrefs>;
  return {
    ...DEFAULT_PREFS,
    ...s,
    visible: { ...DEFAULT_PREFS.visible, ...(s.visible ?? {}) },
  };
}

export function DashboardPrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<DashboardPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefsState(mergePrefs(JSON.parse(raw)));
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-density", prefs.density);
  }, [prefs.density]);

  const api = useMemo<Ctx>(() => {
    const persist = (next: DashboardPrefs) => {
      setPrefsState(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
    };
    return {
      prefs,
      setPrefs: (partial) => persist({ ...prefs, ...partial }),
      setVisible: (key, v) =>
        persist({ ...prefs, visible: { ...prefs.visible, [key]: v } }),
      reset: () => persist(DEFAULT_PREFS),
    };
  }, [prefs]);

  return <DashboardPrefsCtx.Provider value={api}>{children}</DashboardPrefsCtx.Provider>;
}

export const useDashboardPrefs = () => useContext(DashboardPrefsCtx);

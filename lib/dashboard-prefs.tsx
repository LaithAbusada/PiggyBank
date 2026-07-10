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
  | "aiAnalysis"
  | "trends"
  | "budgetPace"
  | "spending"
  | "transactions"
  | "insights"
  | "budgetJar"
  | "quickLog"
  | "recurring"
  | "monthGlance"
  | "streak"
  | "catBudgets"
  | "weekdays"
  | "topMerchants";

export type CashflowChart = "area" | "line" | "bar";
export type SpendingChart = "donut" | "bar";
export type Density = "compact" | "cozy";

export const WIDGET_META: Record<WidgetKey, { label: string; hint: string; rail: boolean }> = {
  cashflow:     { label: "Cashflow chart",       hint: "Income vs. expense over your chosen range.", rail: false },
  aiAnalysis:   { label: "AI analysis",          hint: "A written read on your month, on demand.",    rail: false },
  trends:       { label: "Monthly trends",       hint: "Income vs. expense over the last 6 months.",  rail: false },
  budgetPace:   { label: "Budget pace",          hint: "Cumulative spend vs. an even budget pace.",   rail: false },
  spending:     { label: "Where your money went", hint: "Category breakdown for the month.",          rail: false },
  transactions: { label: "All transactions",     hint: "List with Income/Expense filters.",           rail: false },
  insights:     { label: "Insights",             hint: "Automated observations about your spending.", rail: true },
  budgetJar:    { label: "Budget Jar",           hint: "This month's budget vs. spent.",              rail: true },
  quickLog:     { label: "Quick log",            hint: "Shortcut buttons for usual expenses.",        rail: true },
  recurring:    { label: "Recurring",            hint: "Subscriptions and repeating items.",          rail: true },
  monthGlance:  { label: "Month at a glance",    hint: "Pacing against the month.",                   rail: true },
  streak:       { label: "Streak",               hint: "Days in a row you've logged activity.",       rail: true },
  catBudgets:   { label: "Category budgets",     hint: "Per-category spending vs. caps.",             rail: true },
  weekdays:     { label: "Weekday pattern",      hint: "Which days of the week you spend most.",      rail: true },
  topMerchants: { label: "Top merchants",        hint: "Where the biggest chunks went this month.",   rail: true },
};

export type DashboardPrefs = {
  visible: Record<WidgetKey, boolean>;
  cashflowChart: CashflowChart;
  spendingChart: SpendingChart;
  density: Density;
};

export const DEFAULT_PREFS: DashboardPrefs = {
  visible: {
    cashflow: true,
    aiAnalysis: true,
    trends: true,
    budgetPace: true,
    spending: true,
    transactions: true,
    insights: true,
    budgetJar: true,
    quickLog: true,
    recurring: true,
    monthGlance: true,
    streak: true,
    catBudgets: true,
    weekdays: true,
    topMerchants: true,
  },
  cashflowChart: "area",
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

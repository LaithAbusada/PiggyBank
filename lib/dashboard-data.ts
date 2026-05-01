export type TxnType = "in" | "out";

export type Transaction = {
  id: string;
  type: TxnType;
  title: string;
  sub: string;
  note?: string;
  when: string;
  amount: number;
  cat: string;
  _dateISO?: string;
};

export type TransactionInput = {
  type: TxnType;
  title: string;
  sub: string;
  note?: string;
  cat: string;
  amount: number;
  date: string;
};

type DbTransaction = {
  id: string;
  type: string;
  title: string;
  sub: string;
  note: string | null;
  cat: string;
  amount: number;
  date: string;
};

export function fromDbTransaction(row: DbTransaction): Transaction {
  const d = new Date(row.date);
  const when =
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    ", " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return {
    id: row.id,
    type: row.type === "in" ? "in" : "out",
    title: row.title,
    sub: row.sub,
    note: row.note ?? undefined,
    cat: row.cat,
    amount: row.amount,
    when,
    _dateISO: d.toISOString().slice(0, 10),
  };
}

export const USER = {
  name: "Laith Abusada",
  first: "Laith",
  handle: "@laith.abs",
  email: "laith@piggybank.app",
  balance: 8367.42,
  cardNumber: "•••• •••• •••• 4747",
  cardExp: "02/27",
};

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const RECENT_PEOPLE = [
  { name: "Farah",  initials: "FA", bg: "linear-gradient(135deg, #fde68a, #fb923c)" },
  { name: "Awad",   initials: "AW", bg: "linear-gradient(135deg, #a7f3d0, #34d399)" },
  { name: "Maya",   initials: "MS", bg: "linear-gradient(135deg, #c4b5fd, #8b5cf6)" },
  { name: "Nadia",  initials: "NK", bg: "linear-gradient(135deg, #fecaca, #f472b6)" },
  { name: "Omar",   initials: "OJ", bg: "linear-gradient(135deg, #bae6fd, #38bdf8)" },
];

export const CATEGORIES_OPTIONS = [
  { key: "Restaurants",    color: "oklch(0.55 0.20 295)" },
  { key: "Groceries",      color: "oklch(0.68 0.15 155)" },
  { key: "Transportation", color: "oklch(0.70 0.18 145)" },
  { key: "Utilities",      color: "oklch(0.70 0.16 5)" },
  { key: "Entertainment",  color: "oklch(0.72 0.14 70)" },
  { key: "Shopping",       color: "oklch(0.65 0.18 330)" },
  { key: "Health",         color: "oklch(0.66 0.15 180)" },
  { key: "Rent",           color: "oklch(0.55 0.10 260)" },
  { key: "Income",         color: "oklch(0.68 0.16 155)" },
  { key: "Transfer",       color: "oklch(0.62 0.16 250)" },
  { key: "Other",          color: "oklch(0.60 0.02 280)" },
];

export const CAT_BUDGETS: Record<string, number> = {
  Restaurants: 400,
  Groceries: 350,
  Transportation: 200,
  Utilities: 150,
  Entertainment: 120,
  Shopping: 200,
};

export type DerivedStats = {
  inc: number;
  exp: number;
  catSegments: { label: string; value: number; color: string }[];
  incSeries: number[];
  expSeries: number[];
  monthSpent: number;
  daysElapsed: number;
  daysInMonth: number;
  spendByCat: Record<string, number>;
};

export type MonthRef = { year: number; month: number };

export function currentMonth(): MonthRef {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function shiftMonth({ year, month }: MonthRef, delta: number): MonthRef {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function isSameMonth(a: MonthRef, b: MonthRef) {
  return a.year === b.year && a.month === b.month;
}

export function isFutureMonth(a: MonthRef, ref: MonthRef = currentMonth()) {
  return a.year > ref.year || (a.year === ref.year && a.month > ref.month);
}

export function monthLabel({ year, month }: MonthRef): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function deriveStats(txns: Transaction[], target: MonthRef = currentMonth()): DerivedStats {
  const { year, month } = target;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isCurrent = today.getFullYear() === year && today.getMonth() === month;
  const daysElapsed = isCurrent
    ? today.getDate()
    : isFutureMonth(target, currentMonth())
      ? 0
      : daysInMonth;

  const dateOf = (t: Transaction) => (t._dateISO ? new Date(t._dateISO) : null);
  const inMonth = (t: Transaction) => {
    const d = dateOf(t);
    if (!d) return false;
    return d.getFullYear() === year && d.getMonth() === month;
  };
  const monthTxns = txns.filter(inMonth);

  const inc = monthTxns.filter((t) => t.type === "in").reduce((s, t) => s + Math.abs(t.amount), 0);
  const exp = monthTxns.filter((t) => t.type === "out").reduce((s, t) => s + Math.abs(t.amount), 0);
  const monthSpent = exp;

  const spendByCat: Record<string, number> = {};
  monthTxns.filter((t) => t.type === "out").forEach((t) => {
    spendByCat[t.cat] = (spendByCat[t.cat] || 0) + Math.abs(t.amount);
  });
  const catSegments = Object.entries(spendByCat)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => {
      const meta = CATEGORIES_OPTIONS.find((c) => c.key === k);
      return { label: k, value: v, color: meta ? meta.color : "oklch(0.60 0.02 280)" };
    });

  const incSeries = Array(daysInMonth).fill(0);
  const expSeries = Array(daysInMonth).fill(0);
  monthTxns.forEach((t) => {
    const d = dateOf(t);
    if (!d) return;
    const idx = d.getDate() - 1;
    if (idx < 0 || idx >= daysInMonth) return;
    if (t.type === "in") incSeries[idx] += Math.abs(t.amount);
    else expSeries[idx] += Math.abs(t.amount);
  });
  return { inc, exp, catSegments, incSeries, expSeries, monthSpent, daysElapsed, daysInMonth, spendByCat };
}

export function monthDayLabels(target: MonthRef = currentMonth()): string[] {
  const { year, month } = target;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const ticks = 5;
  const out: string[] = [];
  for (let i = 0; i < ticks; i++) {
    const day = Math.round((i * (daysInMonth - 1)) / (ticks - 1)) + 1;
    const d = new Date(year, month, day);
    out.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
  }
  return out;
}

export const GOALS = [
  { name: "Tokyo trip",     saved: 1840, target: 4500, emoji: "✈️", color: "oklch(0.70 0.16 275)" },
  { name: "Emergency fund", saved: 3200, target: 5000, emoji: "🛟", color: "oklch(0.68 0.15 155)" },
  { name: "New MacBook",    saved: 620,  target: 2200, emoji: "💻", color: "oklch(0.72 0.14 70)" },
];

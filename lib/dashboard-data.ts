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
  incSmooth: number[];
  expSmooth: number[];
  monthSpent: number;
  daysElapsed: number;
  daysInMonth: number;
  spendByCat: Record<string, number>;
};

export function deriveStats(txns: Transaction[], rangeDays = 30): DerivedStats {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysElapsed = now.getDate();
  const days = Math.max(1, rangeDays);

  const inMonth = (t: Transaction) => {
    if (t._dateISO) {
      const d = new Date(t._dateISO);
      return d.getFullYear() === year && d.getMonth() === month;
    }
    return true;
  };
  const monthTxns = txns.filter(inMonth);
  const monthSpent = monthTxns.filter((t) => t.type === "out").reduce((s, t) => s + Math.abs(t.amount), 0);

  const inc = txns.filter((t) => t.type === "in").reduce((s, t) => s + Math.abs(t.amount), 0);
  const exp = txns.filter((t) => t.type === "out").reduce((s, t) => s + Math.abs(t.amount), 0);

  const byCat: Record<string, number> = {};
  txns.filter((t) => t.type === "out").forEach((t) => {
    byCat[t.cat] = (byCat[t.cat] || 0) + Math.abs(t.amount);
  });
  const spendByCat: Record<string, number> = {};
  monthTxns.filter((t) => t.type === "out").forEach((t) => {
    spendByCat[t.cat] = (spendByCat[t.cat] || 0) + Math.abs(t.amount);
  });
  const catSegments = Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => {
      const meta = CATEGORIES_OPTIONS.find((c) => c.key === k);
      return { label: k, value: v, color: meta ? meta.color : "oklch(0.60 0.02 280)" };
    });

  const today = new Date();
  const incSeries = Array(days).fill(0);
  const expSeries = Array(days).fill(0);
  txns.forEach((t) => {
    let d: Date;
    if (t._dateISO) d = new Date(t._dateISO);
    else {
      const parsed = Date.parse(t.when + ", " + today.getFullYear());
      d = isFinite(parsed) ? new Date(parsed) : today;
    }
    const diff = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff < days) {
      const idx = days - 1 - diff;
      if (t.type === "in") incSeries[idx] += Math.abs(t.amount);
      else expSeries[idx] += Math.abs(t.amount);
    }
  });
  const smoothed = (arr: number[], base: number) =>
    arr.map((v, i) => v || base + (Math.sin(i * 0.8) + 1) * base * 0.4);
  const incSmooth = smoothed(incSeries, 60);
  const expSmooth = smoothed(expSeries, 35);

  return { inc, exp, catSegments, incSmooth, expSmooth, monthSpent, daysElapsed, daysInMonth, spendByCat };
}

export function dayLabels(rangeDays = 30): string[] {
  const out: string[] = [];
  const today = new Date();
  const span = Math.max(1, rangeDays);
  const ticks = 5;
  for (let i = 0; i < ticks; i++) {
    const offset = Math.round(((ticks - 1 - i) * (span - 1)) / (ticks - 1));
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    out.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
  }
  return out;
}

export const GOALS = [
  { name: "Tokyo trip",     saved: 1840, target: 4500, emoji: "✈️", color: "oklch(0.70 0.16 275)" },
  { name: "Emergency fund", saved: 3200, target: 5000, emoji: "🛟", color: "oklch(0.68 0.15 155)" },
  { name: "New MacBook",    saved: 620,  target: 2200, emoji: "💻", color: "oklch(0.72 0.14 70)" },
];

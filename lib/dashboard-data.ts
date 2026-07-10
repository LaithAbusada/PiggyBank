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

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Local-date key (YYYY-MM-DD) built from local getters — no UTC shift for users west of UTC. */
export function localDateISO(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Parse a YYYY-MM-DD key by string-splitting (no Date re-parsing). `month` is 0-based like MonthRef. */
export function isoToParts(iso: string): { year: number; month: number; day: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { year: y, month: m - 1, day: d };
}

export function fromDbTransaction(row: DbTransaction): Transaction {
  const d = new Date(row.date);
  // Invariant: an instant at exactly UTC midnight is a date-only sentinel (manual entries
  // store just the calendar day), so decode it from UTC parts — never shift to local time.
  const isDateOnly =
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0;
  const when = isDateOnly
    ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
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
    _dateISO: isDateOnly ? d.toISOString().slice(0, 10) : localDateISO(d),
  };
}

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

  const inMonth = (t: Transaction) => {
    if (!t._dateISO) return false;
    const p = isoToParts(t._dateISO);
    return p.year === year && p.month === month;
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
    if (!t._dateISO) return;
    const idx = isoToParts(t._dateISO).day - 1;
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

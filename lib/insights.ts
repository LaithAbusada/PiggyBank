import { CAT_BUDGETS, currentMonth, isSameMonth, type MonthRef, type Transaction } from "./dashboard-data";

export type InsightTone = "good" | "warn" | "neutral";
export type InsightIcon = "trendUp" | "trendDown" | "sparkle" | "bolt" | "wallet" | "category";

export type Insight = {
  id: string;
  tone: InsightTone;
  icon: InsightIcon;
  title: string;
  body: string;
  stat?: string;
  priority: number;
};

type RecurringLite = { type: "in" | "out"; amount: number };

type Input = {
  txns: Transaction[];
  monthBudget: number;
  recurring: RecurringLite[];
  fmt: (n: number, opts?: { short?: boolean }) => string;
  target?: MonthRef;
};

function dateOf(t: Transaction): Date {
  return t._dateISO ? new Date(t._dateISO) : new Date();
}

function dateInMonth(d: Date, ref: MonthRef) {
  return d.getFullYear() === ref.year && d.getMonth() === ref.month;
}

export function computeInsights({ txns, monthBudget, recurring, fmt, target }: Input): Insight[] {
  const out: Insight[] = [];
  const ref = target ?? currentMonth();
  const today = new Date();
  const y = ref.year;
  const m = ref.month;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const isCurrent = isSameMonth(ref, currentMonth());
  const daysElapsed = isCurrent ? Math.max(1, today.getDate()) : daysInMonth;
  const prev = new Date(y, m - 1, 1);
  const prevRef: MonthRef = { year: prev.getFullYear(), month: prev.getMonth() };

  const thisMonthOut = txns.filter((t) => t.type === "out" && dateInMonth(dateOf(t), ref));
  const thisMonthIn = txns.filter((t) => t.type === "in" && dateInMonth(dateOf(t), ref));
  const lastMonthOut = txns.filter((t) => t.type === "out" && dateInMonth(dateOf(t), prevRef));

  const spent = thisMonthOut.reduce((s, t) => s + Math.abs(t.amount), 0);
  const income = thisMonthIn.reduce((s, t) => s + Math.abs(t.amount), 0);
  const lastSpent = lastMonthOut.reduce((s, t) => s + Math.abs(t.amount), 0);

  // 1. Budget pacing
  if (monthBudget > 0 && spent > 0) {
    const expectedShare = daysElapsed / daysInMonth;
    const actualShare = spent / monthBudget;
    const diff = actualShare - expectedShare;
    const projected = (spent / daysElapsed) * daysInMonth;

    if (actualShare >= 1) {
      out.push({
        id: "budget-over",
        tone: "warn",
        icon: "wallet",
        title: "Over budget",
        body: `You've spent ${fmt(spent, { short: true })} of your ${fmt(monthBudget, { short: true })} budget with ${daysInMonth - daysElapsed} days left.`,
        stat: `${Math.round(actualShare * 100)}%`,
        priority: 100,
      });
    } else if (diff > 0.08) {
      out.push({
        id: "budget-ahead-of-pace",
        tone: "warn",
        icon: "trendUp",
        title: "Spending faster than usual",
        body: `At this pace you'll hit ${fmt(projected, { short: true })} by month-end — about ${fmt(projected - monthBudget, { short: true })} over your ${fmt(monthBudget, { short: true })} budget.`,
        stat: `+${Math.round(diff * 100)}%`,
        priority: 85,
      });
    } else if (diff < -0.1) {
      out.push({
        id: "budget-behind-pace",
        tone: "good",
        icon: "trendDown",
        title: "Comfortably under pace",
        body: `You're ${Math.round(-diff * 100)}% below where you'd normally be by day ${daysElapsed}. Projecting ${fmt(projected, { short: true })} by month-end.`,
        stat: `${Math.round(-diff * 100)}% under`,
        priority: 60,
      });
    }
  }

  // 2. Month-over-month
  if (lastSpent > 0 && spent > 0 && daysElapsed >= 3) {
    const lastPro = lastSpent * (daysElapsed / daysInMonth);
    const delta = (spent - lastPro) / lastPro;
    if (Math.abs(delta) >= 0.15) {
      const pct = Math.round(Math.abs(delta) * 100);
      if (delta > 0) {
        out.push({
          id: "vs-last-up",
          tone: "warn",
          icon: "trendUp",
          title: "Spending more than last month",
          body: `You're ${pct}% above last month's same-stretch spending of ${fmt(lastPro, { short: true })}.`,
          stat: `+${pct}%`,
          priority: 70,
        });
      } else {
        out.push({
          id: "vs-last-down",
          tone: "good",
          icon: "trendDown",
          title: "Spending less than last month",
          body: `Down ${pct}% vs the same stretch of last month. You saved around ${fmt(lastPro - spent, { short: true })}.`,
          stat: `-${pct}%`,
          priority: 65,
        });
      }
    }
  }

  // 3. Top category
  const byCat: Record<string, number> = {};
  thisMonthOut.forEach((t) => {
    byCat[t.cat] = (byCat[t.cat] || 0) + Math.abs(t.amount);
  });
  const sortedCats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  if (sortedCats.length > 0 && spent > 0) {
    const [topCat, topAmt] = sortedCats[0];
    const share = topAmt / spent;
    if (share >= 0.25) {
      out.push({
        id: "top-category",
        tone: "neutral",
        icon: "category",
        title: `${topCat} is your biggest bucket`,
        body: `${fmt(topAmt, { short: true })} this month — ${Math.round(share * 100)}% of everything you spent.`,
        stat: `${Math.round(share * 100)}%`,
        priority: 50,
      });
    }
  }

  // 4. Category over its budget
  for (const [cat, amt] of sortedCats) {
    const cap = CAT_BUDGETS[cat];
    if (cap && amt > cap) {
      const over = amt - cap;
      out.push({
        id: `cat-over-${cat}`,
        tone: "warn",
        icon: "category",
        title: `${cat} over its limit`,
        body: `${fmt(amt, { short: true })} spent against a ${fmt(cap, { short: true })} cap — ${fmt(over, { short: true })} over.`,
        stat: `+${fmt(over, { short: true })}`,
        priority: 80,
      });
      break;
    }
  }

  // 5. Biggest single expense
  if (thisMonthOut.length >= 5) {
    const biggest = [...thisMonthOut].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0];
    if (biggest && Math.abs(biggest.amount) >= spent * 0.15) {
      out.push({
        id: "biggest-txn",
        tone: "neutral",
        icon: "bolt",
        title: "Biggest hit this month",
        body: `"${biggest.title}" — ${fmt(Math.abs(biggest.amount), { short: true })}. That's ${Math.round((Math.abs(biggest.amount) / spent) * 100)}% of your month.`,
        priority: 40,
      });
    }
  }

  // 6. Recurring commitments total
  const recurringOut = recurring.filter((r) => r.type === "out").reduce((s, r) => s + r.amount, 0);
  const recurringIn = recurring.filter((r) => r.type === "in").reduce((s, r) => s + r.amount, 0);
  if (recurringOut > 0) {
    const discretionary = Math.max(0, monthBudget - recurringOut);
    out.push({
      id: "recurring",
      tone: "neutral",
      icon: "wallet",
      title: "Locked in each month",
      body: monthBudget > recurringOut
        ? `${fmt(recurringOut, { short: true })} auto-posts as recurring. That leaves ${fmt(discretionary, { short: true })} of your budget for everything else.`
        : `${fmt(recurringOut, { short: true })} auto-posts as recurring — already above your ${fmt(monthBudget, { short: true })} budget before discretionary spending.`,
      priority: monthBudget > 0 && recurringOut > monthBudget ? 90 : 35,
    });
  }

  // 7. Net flow
  if (income > 0 && spent > 0) {
    const net = income - spent;
    if (net < 0) {
      out.push({
        id: "net-negative",
        tone: "warn",
        icon: "trendDown",
        title: "Running at a deficit",
        body: `You're ${fmt(Math.abs(net), { short: true })} in the red this month — spending more than you've logged coming in.`,
        stat: `-${fmt(Math.abs(net), { short: true })}`,
        priority: 75,
      });
    } else if (net > income * 0.25) {
      out.push({
        id: "net-positive",
        tone: "good",
        icon: "sparkle",
        title: "Healthy cashflow",
        body: `You've kept ${fmt(net, { short: true })} of the ${fmt(income, { short: true })} you logged — ${Math.round((net / income) * 100)}% of income retained.`,
        stat: `+${fmt(net, { short: true })}`,
        priority: 55,
      });
    }
  }

  // 8. Empty state
  if (out.length === 0) {
    if (txns.length === 0) {
      out.push({
        id: "empty-none",
        tone: "neutral",
        icon: "sparkle",
        title: "Log a few things first",
        body: "Once you've added a handful of transactions, insights will show up here — budget pacing, category trends, month-over-month shifts.",
        priority: 1,
      });
    } else {
      out.push({
        id: "empty-steady",
        tone: "good",
        icon: "sparkle",
        title: "Nothing unusual",
        body: "Spending looks steady. No categories over their cap, no big swings vs last month.",
        priority: 1,
      });
    }
  }

  // silence the unused warning
  void recurringIn;

  return out.sort((a, b) => b.priority - a.priority);
}

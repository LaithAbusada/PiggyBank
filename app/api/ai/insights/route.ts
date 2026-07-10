import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { AI_MODEL, aiErrorResponse, aiNotConfigured, firstText, getAnthropic } from "@/lib/ai";

export const maxDuration = 60;

const INSIGHTS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["overview", "highlights", "suggestions"],
  properties: {
    overview: { type: "string" },
    highlights: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["tone", "title", "detail"],
        properties: {
          tone: { type: "string", enum: ["good", "bad", "neutral"] },
          title: { type: "string" },
          detail: { type: "string" },
        },
      },
    },
    suggestions: { type: "array", items: { type: "string" } },
  },
};

const round2 = (n: number) => Math.round(n * 100) / 100;

type TxnLite = { type: string; title: string; cat: string; amount: number; date: Date };

function summarizeMonth(txns: TxnLite[]) {
  let totalIncome = 0;
  let totalExpenses = 0;
  const spendByCategory: Record<string, number> = {};
  for (const t of txns) {
    const amt = Math.abs(t.amount);
    if (t.type === "in") {
      totalIncome += amt;
    } else {
      totalExpenses += amt;
      spendByCategory[t.cat] = (spendByCategory[t.cat] || 0) + amt;
    }
  }
  for (const k of Object.keys(spendByCategory)) {
    spendByCategory[k] = round2(spendByCategory[k]);
  }
  return {
    totalIncome: round2(totalIncome),
    totalExpenses: round2(totalExpenses),
    spendByCategory,
    transactionCount: txns.length,
  };
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => null);
  const month = body && typeof body === "object" ? (body as Record<string, unknown>).month : null;
  if (typeof month !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return NextResponse.json({ error: "month must be YYYY-MM" }, { status: 400 });
  }
  // Optional client timezone offset (minutes east of UTC) so month/day buckets
  // line up with what the dashboard renders in the browser's local time.
  const rawTz =
    body && typeof body === "object" ? (body as Record<string, unknown>).tzOffsetMin : undefined;
  let tzOffsetMin = 0;
  if (rawTz !== undefined) {
    if (typeof rawTz !== "number" || !Number.isInteger(rawTz) || rawTz < -840 || rawTz > 840) {
      return NextResponse.json(
        { error: "tzOffsetMin must be an integer between -840 and 840" },
        { status: 400 }
      );
    }
    tzOffsetMin = rawTz;
  }
  const offMs = tzOffsetMin * 60000;

  const anthropic = getAnthropic();
  if (!anthropic) return aiNotConfigured();

  const year = parseInt(month.slice(0, 4), 10);
  const monthIdx = parseInt(month.slice(5, 7), 10) - 1;
  const prevStart = new Date(Date.UTC(year, monthIdx - 1, 1) - offMs);
  const targetStart = new Date(Date.UTC(year, monthIdx, 1) - offMs);
  const nextStart = new Date(Date.UTC(year, monthIdx + 1, 1) - offMs);

  const [txns, recurring] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: user.id, date: { gte: prevStart, lt: nextStart } },
      select: { type: true, title: true, cat: true, amount: true, date: true },
      orderBy: { date: "asc" },
    }),
    prisma.recurring.findMany({
      where: { userId: user.id, active: true },
      select: { title: true, type: true, amount: true, dayOfMonth: true },
    }),
  ]);

  const targetTxns = txns.filter((t) => t.date >= targetStart);
  const prevTxns = txns.filter((t) => t.date < targetStart);

  const merchantTotals: Record<string, { total: number; count: number }> = {};
  for (const t of targetTxns) {
    if (t.type === "in") continue;
    const entry = merchantTotals[t.title] || { total: 0, count: 0 };
    entry.total += Math.abs(t.amount);
    entry.count += 1;
    merchantTotals[t.title] = entry;
  }
  const topMerchantsBySpend = Object.entries(merchantTotals)
    .map(([title, v]) => ({ title, total: round2(v.total), count: v.count }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Per-day expense detail is skipped for very large months — aggregates +
  // top merchants only (keeps the prompt bounded).
  let expensesByDay: Record<string, number> | undefined;
  if (targetTxns.length <= 300) {
    const perDay: Record<string, number> = {};
    for (const t of targetTxns) {
      if (t.type === "in") continue;
      const day = String(new Date(t.date.getTime() + offMs).getUTCDate());
      perDay[day] = (perDay[day] || 0) + Math.abs(t.amount);
    }
    for (const k of Object.keys(perDay)) perDay[k] = round2(perDay[k]);
    expensesByDay = perDay;
  }

  // catBudgets is being added to the User model by a parallel change — read
  // it defensively so this route works with or without the column.
  const rawCatBudgets = (user as unknown as { catBudgets?: unknown }).catBudgets;
  const catBudgets: Record<string, number> = {};
  if (rawCatBudgets && typeof rawCatBudgets === "object" && !Array.isArray(rawCatBudgets)) {
    for (const [k, v] of Object.entries(rawCatBudgets as Record<string, unknown>)) {
      if (typeof v === "number" && isFinite(v) && v > 0) catBudgets[k] = v;
    }
  }

  // Label from the unshifted month start — prevStart itself is offset-shifted.
  const prevMonthDate = new Date(Date.UTC(year, monthIdx - 1, 1));
  const prevMonthLabel = `${prevMonthDate.getUTCFullYear()}-${String(
    prevMonthDate.getUTCMonth() + 1
  ).padStart(2, "0")}`;

  const nowMs = Date.now();
  const nowShifted = new Date(nowMs + offMs);
  const isPartial = nowMs >= targetStart.getTime() && nowMs < nextStart.getTime();
  const daysInMonth = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();
  const daysElapsed = isPartial ? nowShifted.getUTCDate() : daysInMonth;

  const summary = {
    targetMonth: {
      month,
      ...summarizeMonth(targetTxns),
      topMerchantsBySpend,
      ...(expensesByDay ? { expensesByDay } : {}),
    },
    previousMonth: {
      month: prevMonthLabel,
      ...summarizeMonth(prevTxns),
    },
    isPartial,
    daysElapsed,
    daysInMonth,
    monthBudget: user.monthBudget,
    catBudgets,
    recurring: recurring.map((r) => ({
      title: r.title,
      type: r.type,
      amount: round2(Math.abs(r.amount)),
      dayOfMonth: r.dayOfMonth,
    })),
  };

  const prompt = [
    "You are a personal-finance analyst for the PiggyBank app. Below is a JSON summary of one user's finances for a target month and the month before it. All amounts are in USD.",
    "",
    'Analyze this user\'s month, compare it to the previous month, call out what is going well (tone "good") and what is concerning (tone "bad"), reference concrete numbers and categories, and give practical suggestions. Be specific to the data, never generic. Produce 3-6 highlights, 2-4 suggestions, and an overview of 2-3 sentences.',
    "",
    "If isPartial is true, the target month is still in progress (only daysElapsed of daysInMonth days have elapsed) — compare it to the previous month on a pro-rated / run-rate basis and say the month is incomplete rather than claiming spending genuinely decreased.",
    "",
    "Data:",
    JSON.stringify(summary),
  ].join("\n");

  let response: Anthropic.Message;
  try {
    response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { format: { type: "json_schema", schema: INSIGHTS_SCHEMA } },
      messages: [{ role: "user", content: prompt }],
    });
  } catch (err) {
    return aiErrorResponse(err);
  }

  if (response.stop_reason === "refusal") {
    return NextResponse.json({ error: "AI declined this request" }, { status: 502 });
  }
  if (response.stop_reason === "max_tokens") {
    return NextResponse.json(
      { error: "AI response was cut off before completing — please retry" },
      { status: 502 }
    );
  }
  const text = firstText(response);
  if (!text) return NextResponse.json({ error: "AI returned no output" }, { status: 502 });

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 502 });
  }

  const root = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;
  if (
    typeof root.overview !== "string" ||
    !Array.isArray(root.highlights) ||
    !Array.isArray(root.suggestions)
  ) {
    return NextResponse.json({ error: "AI returned an unexpected shape" }, { status: 502 });
  }

  const highlights = root.highlights
    .filter((h): h is Record<string, unknown> => !!h && typeof h === "object" && !Array.isArray(h))
    .map((h) => ({
      tone: h.tone === "good" || h.tone === "bad" ? h.tone : ("neutral" as const),
      title: typeof h.title === "string" ? h.title : "",
      detail: typeof h.detail === "string" ? h.detail : "",
    }))
    .filter((h) => h.title || h.detail);
  const suggestions = root.suggestions.filter((s): s is string => typeof s === "string");

  return NextResponse.json({
    month,
    overview: root.overview,
    highlights,
    suggestions,
    generatedAt: new Date().toISOString(),
  });
}

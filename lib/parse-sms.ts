import { createHash } from "crypto";
import { prisma } from "./prisma";
import { CURRENCIES, isCurrencyCode } from "./currencies";

export function hashSms(raw: string, receivedAt: Date): string {
  return createHash("sha256")
    .update(`${raw}|${receivedAt.toISOString()}`)
    .digest("hex");
}

export type ParsedSms = {
  type: "in" | "out";
  amount: number;
  merchant: string;
  category: string;
  ruleId: string;
};

function safeRegex(pattern: string): RegExp | null {
  try {
    return new RegExp(pattern, "i");
  } catch {
    return null;
  }
}

export async function parseSms(userId: string, raw: string): Promise<ParsedSms | null> {
  const [rules, aliases] = await Promise.all([
    prisma.parseRule.findMany({
      where: { userId, active: true },
      orderBy: { priority: "desc" },
    }),
    prisma.categoryAlias.findMany({
      where: { userId, active: true },
      orderBy: { priority: "desc" },
    }),
  ]);

  const rawLower = raw.toLowerCase();

  for (const rule of rules) {
    if (rule.senderPattern) {
      const re = safeRegex(rule.senderPattern);
      if (!re || !re.test(raw)) continue;
    }
    if (rule.contentPattern) {
      const re = safeRegex(rule.contentPattern);
      if (!re || !re.test(raw)) continue;
    }

    const amountRe = safeRegex(rule.amountRegex);
    if (!amountRe) continue;
    const am = amountRe.exec(raw);
    if (!am || !am[1]) continue;
    const rawAmount = parseFloat(am[1].replace(/,/g, ""));
    if (!isFinite(rawAmount)) continue;

    const merchantRe = safeRegex(rule.merchantRegex);
    if (!merchantRe) continue;
    const mm = merchantRe.exec(raw);
    if (!mm || !mm[1]) continue;
    const merchant = mm[1].trim();
    if (!merchant) continue;

    if (rule.type !== "in" && rule.type !== "out") continue;

    let useCurrency = isCurrencyCode(rule.currency) ? rule.currency : "USD";
    if (rule.currencyRegex) {
      const cre = safeRegex(rule.currencyRegex);
      const cm = cre?.exec(raw);
      const captured = cm?.[1]?.trim().toUpperCase();
      if (captured && isCurrencyCode(captured)) useCurrency = captured;
    }
    const rate = CURRENCIES[useCurrency].rate;
    const amount = rate ? rawAmount / rate : rawAmount;

    const merchantLower = merchant.toLowerCase();
    const matchedAlias = aliases.find((a) => {
      const kw = a.keyword.trim().toLowerCase();
      if (!kw) return false;
      return merchantLower.includes(kw) || rawLower.includes(kw);
    });

    return {
      type: rule.type as "in" | "out",
      amount,
      merchant,
      category: matchedAlias?.category ?? rule.defaultCategory,
      ruleId: rule.id,
    };
  }
  return null;
}

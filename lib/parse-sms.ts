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
  const rules = await prisma.parseRule.findMany({
    where: { userId, active: true },
    orderBy: { priority: "desc" },
  });

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

    const rate = isCurrencyCode(rule.currency) ? CURRENCIES[rule.currency].rate : 1;
    const amount = rate ? rawAmount / rate : rawAmount;

    return {
      type: rule.type as "in" | "out",
      amount,
      merchant,
      category: rule.defaultCategory,
      ruleId: rule.id,
    };
  }
  return null;
}

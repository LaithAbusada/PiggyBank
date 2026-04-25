import { isCurrencyCode, type CurrencyCode } from "./currencies";

export type RuleInput = {
  name: string;
  senderPattern: string | null;
  contentPattern: string | null;
  amountRegex: string;
  merchantRegex: string;
  currencyRegex: string | null;
  type: "in" | "out";
  defaultCategory: string;
  currency: CurrencyCode;
  priority: number;
  active: boolean;
};

type Result = { ok: true; data: RuleInput } | { ok: false; error: string };

function readOptRegex(v: unknown): string | null | undefined {
  if (v === undefined || v === null || v === "") return null;
  return typeof v === "string" ? v : undefined;
}

function compiles(pattern: string): boolean {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

export function validateRule(body: unknown): Result {
  if (!body || typeof body !== "object") return { ok: false, error: "Bad body" };
  const b = body as Record<string, unknown>;

  if (typeof b.name !== "string" || !b.name.trim()) return { ok: false, error: "Bad name" };

  const senderPattern = readOptRegex(b.senderPattern);
  if (senderPattern === undefined) return { ok: false, error: "Bad senderPattern" };
  if (senderPattern !== null && !compiles(senderPattern)) {
    return { ok: false, error: "Invalid senderPattern regex" };
  }

  const contentPattern = readOptRegex(b.contentPattern);
  if (contentPattern === undefined) return { ok: false, error: "Bad contentPattern" };
  if (contentPattern !== null && !compiles(contentPattern)) {
    return { ok: false, error: "Invalid contentPattern regex" };
  }

  if (typeof b.amountRegex !== "string" || !b.amountRegex.trim()) {
    return { ok: false, error: "Bad amountRegex" };
  }
  if (!compiles(b.amountRegex)) return { ok: false, error: "Invalid amountRegex" };

  if (typeof b.merchantRegex !== "string" || !b.merchantRegex.trim()) {
    return { ok: false, error: "Bad merchantRegex" };
  }
  if (!compiles(b.merchantRegex)) return { ok: false, error: "Invalid merchantRegex" };

  const currencyRegex = readOptRegex(b.currencyRegex);
  if (currencyRegex === undefined) return { ok: false, error: "Bad currencyRegex" };
  if (currencyRegex !== null && !compiles(currencyRegex)) {
    return { ok: false, error: "Invalid currencyRegex" };
  }

  if (b.type !== "in" && b.type !== "out") return { ok: false, error: "Bad type" };

  if (typeof b.defaultCategory !== "string" || !b.defaultCategory.trim()) {
    return { ok: false, error: "Bad defaultCategory" };
  }

  let currency: CurrencyCode;
  if (b.currency === undefined) {
    currency = "USD";
  } else if (isCurrencyCode(b.currency)) {
    currency = b.currency;
  } else {
    return { ok: false, error: "Bad currency" };
  }

  const priority =
    b.priority === undefined
      ? 0
      : typeof b.priority === "number" && Number.isInteger(b.priority)
        ? b.priority
        : NaN;
  if (Number.isNaN(priority)) return { ok: false, error: "Bad priority" };

  let active: boolean;
  if (b.active === undefined) {
    active = true;
  } else if (typeof b.active === "boolean") {
    active = b.active;
  } else {
    return { ok: false, error: "Bad active" };
  }

  return {
    ok: true,
    data: {
      name: b.name.trim(),
      senderPattern,
      contentPattern,
      amountRegex: b.amountRegex,
      merchantRegex: b.merchantRegex,
      currencyRegex,
      type: b.type,
      defaultCategory: b.defaultCategory.trim(),
      currency,
      priority,
      active,
    },
  };
}

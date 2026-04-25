export type RuleInput = {
  name: string;
  senderPattern: string | null;
  contentPattern: string | null;
  amountRegex: string;
  merchantRegex: string;
  type: "in" | "out";
  defaultCategory: string;
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

  if (b.type !== "in" && b.type !== "out") return { ok: false, error: "Bad type" };

  if (typeof b.defaultCategory !== "string" || !b.defaultCategory.trim()) {
    return { ok: false, error: "Bad defaultCategory" };
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
      type: b.type,
      defaultCategory: b.defaultCategory.trim(),
      priority,
      active,
    },
  };
}

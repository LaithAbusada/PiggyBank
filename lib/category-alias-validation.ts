export type CategoryAliasInput = {
  keyword: string;
  category: string;
  priority: number;
  active: boolean;
};

type Result = { ok: true; data: CategoryAliasInput } | { ok: false; error: string };

export function validateAlias(body: unknown): Result {
  if (!body || typeof body !== "object") return { ok: false, error: "Bad body" };
  const b = body as Record<string, unknown>;

  if (typeof b.keyword !== "string" || !b.keyword.trim()) return { ok: false, error: "Bad keyword" };
  if (typeof b.category !== "string" || !b.category.trim()) return { ok: false, error: "Bad category" };

  const priority =
    b.priority === undefined
      ? 0
      : typeof b.priority === "number" && Number.isInteger(b.priority)
        ? b.priority
        : NaN;
  if (Number.isNaN(priority)) return { ok: false, error: "Bad priority" };

  const active =
    b.active === undefined ? true : typeof b.active === "boolean" ? b.active : null;
  if (active === null) return { ok: false, error: "Bad active" };

  return {
    ok: true,
    data: {
      keyword: b.keyword.trim(),
      category: b.category.trim(),
      priority,
      active,
    },
  };
}

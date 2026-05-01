import { prisma } from "./prisma";

export function ymOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function parseYm(ym: string): { y: number; m: number } {
  const [y, m] = ym.split("-").map(Number);
  return { y, m: m - 1 };
}

function nextYm(ym: string): string {
  const { y, m } = parseYm(ym);
  const d = new Date(y, m + 1, 1);
  return ymOf(d);
}

function ymCompare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

const MAX_CATCHUP_MONTHS = 12;

export async function materializeRecurring(userId: string, now: Date = new Date()): Promise<number> {
  const items = await prisma.recurring.findMany({
    where: { userId, active: true },
  });
  if (!items.length) return 0;

  const currentYm = ymOf(now);
  let created = 0;

  for (const r of items) {
    let cursor = r.lastRunYm ? nextYm(r.lastRunYm) : r.startYm;
    const toCreate: { ym: string }[] = [];
    let safety = 0;

    while (ymCompare(cursor, currentYm) <= 0 && safety < MAX_CATCHUP_MONTHS) {
      if (cursor === currentYm) {
        const { y, m } = parseYm(cursor);
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        const dayThisMonth = Math.min(Math.max(1, r.dayOfMonth), daysInMonth);
        if (now.getDate() < dayThisMonth) break;
      }
      toCreate.push({ ym: cursor });
      cursor = nextYm(cursor);
      safety++;
    }

    if (!toCreate.length) continue;

    for (const { ym } of toCreate) {
      const { y, m } = parseYm(ym);
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      const day = Math.min(Math.max(1, r.dayOfMonth), daysInMonth);
      const date = new Date(y, m, day, 9, 0, 0);

      await prisma.transaction.create({
        data: {
          userId: r.userId,
          type: r.type,
          title: r.title,
          sub: r.sub,
          note: r.note,
          cat: r.cat,
          amount: r.type === "in" ? Math.abs(r.amount) : -Math.abs(r.amount),
          date,
        },
      });
      created++;
    }

    await prisma.recurring.update({
      where: { id: r.id },
      data: { lastRunYm: toCreate[toCreate.length - 1].ym },
    });
  }

  return created;
}

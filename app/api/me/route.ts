import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";

function catBudgetsOf(user: { catBudgets?: unknown }): Record<string, number> {
  const v = user.catBudgets;
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, number>;
  return {};
}

export async function GET() {
  const user = await requireUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  return NextResponse.json({ monthBudget: user.monthBudget, catBudgets: catBudgetsOf(user) });
}

export async function PUT(req: Request) {
  const user = await requireUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return new NextResponse("Bad body", { status: 400 });

  const data: { monthBudget?: number; catBudgets?: Prisma.InputJsonValue } = {};
  if (typeof body?.monthBudget === "number" && body.monthBudget > 0) {
    data.monthBudget = body.monthBudget;
  }
  if (body?.catBudgets !== undefined) {
    const cb = body.catBudgets;
    if (!cb || typeof cb !== "object" || Array.isArray(cb)) {
      return new NextResponse("Bad catBudgets", { status: 400 });
    }
    const clean: Record<string, number> = {};
    for (const [key, value] of Object.entries(cb as Record<string, unknown>)) {
      if (key && typeof value === "number" && isFinite(value) && value > 0) {
        clean[key] = value;
      }
    }
    data.catBudgets = clean;
  }
  if (!Object.keys(data).length) return new NextResponse("Nothing to update", { status: 400 });

  const updated = await prisma.user.update({ where: { id: user.id }, data });
  return NextResponse.json({ monthBudget: updated.monthBudget, catBudgets: catBudgetsOf(updated) });
}

export async function DELETE() {
  const user = await requireUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  // Delete the Clerk identity first: if it fails, keep the DB row so a
  // surviving Clerk session cannot re-provision an empty account later.
  // A Clerk 404 means the identity is already gone (e.g. a prior attempt
  // deleted it but the DB purge failed), so treat it as success and continue.
  try {
    const clerk = await clerkClient();
    await clerk.users.deleteUser(user.id);
  } catch (err) {
    const e = err as { status?: number; errors?: Array<{ code?: string }> };
    const notFound =
      e?.status === 404 ||
      (Array.isArray(e?.errors) && e.errors.some((x) => x?.code === "resource_not_found"));
    if (!notFound) return new NextResponse("Failed to delete account", { status: 500 });
  }

  // The Clerk identity is gone at this point, so a 500 would leave the row
  // orphaned with no way to retry. Purge best-effort with one retry and log
  // if it still fails.
  try {
    await prisma.user.delete({ where: { id: user.id } });
  } catch {
    try {
      await prisma.user.delete({ where: { id: user.id } });
    } catch (err) {
      console.error("[account-deletion] DB purge failed for user", user.id, err);
    }
  }

  return new NextResponse(null, { status: 204 });
}

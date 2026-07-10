import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { ymOf } from "@/lib/recurring";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return new NextResponse("Bad body", { status: 400 });
  const data: Record<string, unknown> = {};

  if (typeof body?.active === "boolean") data.active = body.active;
  if (typeof body?.type === "string" && (body.type === "in" || body.type === "out")) data.type = body.type;
  if (typeof body?.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (typeof body?.sub === "string") data.sub = body.sub;
  if (typeof body?.note === "string") data.note = body.note.length ? body.note : null;
  else if (body?.note === null) data.note = null;
  if (typeof body?.cat === "string" && body.cat.length) data.cat = body.cat;
  if (typeof body?.amount === "number" && isFinite(body.amount) && body.amount > 0)
    data.amount = Math.abs(body.amount);
  if (typeof body?.dayOfMonth === "number" && body.dayOfMonth >= 1 && body.dayOfMonth <= 31)
    data.dayOfMonth = Math.round(body.dayOfMonth);

  if (Object.keys(data).length === 0) return new NextResponse("No fields", { status: 400 });

  const existing = await prisma.recurring.findFirst({ where: { id, userId: user.id } });
  if (!existing) return new NextResponse("Not found", { status: 404 });

  // Resuming a paused item: lastRunYm froze while paused, so materialization
  // would otherwise back-create a transaction for every paused month. Advance
  // the cursor to last month so it resumes from the current month only (its
  // dayOfMonth gate still applies). Never move the cursor backward.
  if (data.active === true && existing.active === false) {
    const now = new Date();
    const prevYm = ymOf(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    if (existing.lastRunYm === null || existing.lastRunYm < prevYm) {
      data.lastRunYm = prevYm;
    }
  }

  await prisma.recurring.updateMany({
    where: { id, userId: user.id },
    data,
  });

  const row = await prisma.recurring.findFirst({ where: { id, userId: user.id } });
  return NextResponse.json(row);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const result = await prisma.recurring.deleteMany({
    where: { id, userId: user.id },
  });
  if (result.count === 0) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(null, { status: 204 });
}

import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { requireUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  return NextResponse.json({ monthBudget: user.monthBudget });
}

export async function PUT(req: Request) {
  const user = await requireUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const data: { monthBudget?: number } = {};
  if (typeof body?.monthBudget === "number" && body.monthBudget > 0) {
    data.monthBudget = body.monthBudget;
  }
  if (!Object.keys(data).length) return new NextResponse("Nothing to update", { status: 400 });

  const updated = await prisma.user.update({ where: { id: user.id }, data });
  return NextResponse.json({ monthBudget: updated.monthBudget });
}

export async function DELETE() {
  const user = await requireUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  await prisma.user.delete({ where: { id: user.id } });

  try {
    const clerk = await clerkClient();
    await clerk.users.deleteUser(user.id);
  } catch {
    // If Clerk deletion fails, DB is already gone; client signs out either way.
  }

  return new NextResponse(null, { status: 204 });
}

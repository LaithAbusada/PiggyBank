import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { materializeRecurring, ymOf } from "@/lib/recurring";

export async function GET() {
  const user = await requireUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const rows = await prisma.recurring.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const { type, title, sub, note, cat, amount, dayOfMonth } = body ?? {};

  if (type !== "in" && type !== "out") return new NextResponse("Bad type", { status: 400 });
  if (typeof title !== "string" || !title.trim()) return new NextResponse("Bad title", { status: 400 });
  if (typeof amount !== "number" || !isFinite(amount) || amount <= 0)
    return new NextResponse("Bad amount", { status: 400 });
  if (typeof dayOfMonth !== "number" || dayOfMonth < 1 || dayOfMonth > 31)
    return new NextResponse("Bad dayOfMonth", { status: 400 });

  const row = await prisma.recurring.create({
    data: {
      userId: user.id,
      type,
      title: title.trim(),
      sub: typeof sub === "string" ? sub : "",
      note: typeof note === "string" && note.length ? note : null,
      cat: typeof cat === "string" && cat.length ? cat : "Other",
      amount: Math.abs(amount),
      dayOfMonth: Math.round(dayOfMonth),
      startYm: ymOf(new Date()),
    },
  });

  await materializeRecurring(user.id);

  return NextResponse.json(row, { status: 201 });
}

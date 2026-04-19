import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { materializeRecurring } from "@/lib/recurring";

export async function GET() {
  const user = await requireUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  await materializeRecurring(user.id);

  const rows = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const { type, title, sub, note, cat, amount, date } = body ?? {};

  if (type !== "in" && type !== "out") return new NextResponse("Bad type", { status: 400 });
  if (typeof title !== "string" || !title.trim()) return new NextResponse("Bad title", { status: 400 });
  if (typeof amount !== "number" || !isFinite(amount)) return new NextResponse("Bad amount", { status: 400 });

  const parsedDate = date ? new Date(date) : new Date();
  if (isNaN(parsedDate.getTime())) return new NextResponse("Bad date", { status: 400 });

  const row = await prisma.transaction.create({
    data: {
      userId: user.id,
      type,
      title: title.trim(),
      sub: typeof sub === "string" ? sub : "",
      note: typeof note === "string" && note.length ? note : null,
      cat: typeof cat === "string" && cat.length ? cat : "Other",
      amount,
      date: parsedDate,
    },
  });
  return NextResponse.json(row, { status: 201 });
}

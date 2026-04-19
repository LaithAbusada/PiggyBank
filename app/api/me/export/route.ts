import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const [transactions, recurring] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    }),
    prisma.recurring.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      monthBudget: user.monthBudget,
      createdAt: user.createdAt,
    },
    transactions,
    recurring,
  };

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="piggybank-export-${stamp}.json"`,
    },
  });
}

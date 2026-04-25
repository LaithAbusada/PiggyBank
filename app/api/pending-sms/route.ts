import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const rows = await prisma.pendingSms.findMany({
    where: { userId: user.id },
    orderBy: { receivedAt: "desc" },
  });
  return NextResponse.json(rows);
}

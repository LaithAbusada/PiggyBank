import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { validateRule } from "@/lib/parse-rule-validation";

export async function GET() {
  const user = await requireUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const rows = await prisma.parseRule.findMany({
    where: { userId: user.id },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => null);
  const v = validateRule(body);
  if (!v.ok) return new NextResponse(v.error, { status: 400 });

  const row = await prisma.parseRule.create({
    data: { userId: user.id, ...v.data },
  });
  return NextResponse.json(row, { status: 201 });
}

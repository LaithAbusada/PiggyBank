import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { validateRule } from "@/lib/parse-rule-validation";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const v = validateRule(body);
  if (!v.ok) return new NextResponse(v.error, { status: 400 });

  const result = await prisma.parseRule.updateMany({
    where: { id, userId: user.id },
    data: v.data,
  });
  if (result.count === 0) return new NextResponse("Not found", { status: 404 });

  const row = await prisma.parseRule.findUnique({ where: { id } });
  return NextResponse.json(row);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const result = await prisma.parseRule.deleteMany({
    where: { id, userId: user.id },
  });
  if (result.count === 0) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(null, { status: 204 });
}

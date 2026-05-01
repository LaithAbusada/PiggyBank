import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const result = await prisma.transaction.deleteMany({
    where: { id, userId: user.id },
  });
  if (result.count === 0) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(null, { status: 204 });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (typeof body?.type === "string" && (body.type === "in" || body.type === "out")) data.type = body.type;
  if (typeof body?.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (typeof body?.sub === "string") data.sub = body.sub;
  if (typeof body?.note === "string") data.note = body.note.length ? body.note : null;
  else if (body?.note === null) data.note = null;
  if (typeof body?.cat === "string" && body.cat.length) data.cat = body.cat;
  if (typeof body?.amount === "number" && isFinite(body.amount)) data.amount = body.amount;
  if (typeof body?.date === "string") {
    const d = new Date(body.date);
    if (!isNaN(d.getTime())) data.date = d;
  }

  if (Object.keys(data).length === 0) return new NextResponse("No fields", { status: 400 });

  const result = await prisma.transaction.updateMany({
    where: { id, userId: user.id },
    data,
  });
  if (result.count === 0) return new NextResponse("Not found", { status: 404 });

  const row = await prisma.transaction.findFirst({ where: { id, userId: user.id } });
  return NextResponse.json(row);
}

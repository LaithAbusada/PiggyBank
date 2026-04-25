import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return new NextResponse("Bad body", { status: 400 });
  const b = body as Record<string, unknown>;

  if (b.type !== "in" && b.type !== "out") return new NextResponse("Bad type", { status: 400 });
  if (typeof b.title !== "string" || !b.title.trim()) return new NextResponse("Bad title", { status: 400 });
  if (typeof b.amount !== "number" || !isFinite(b.amount)) return new NextResponse("Bad amount", { status: 400 });
  if (typeof b.cat !== "string" || !b.cat.trim()) return new NextResponse("Bad cat", { status: 400 });

  const pending = await prisma.pendingSms.findFirst({
    where: { id, userId: user.id },
  });
  if (!pending) return new NextResponse("Not found", { status: 404 });

  const date = b.date ? new Date(b.date as string) : pending.receivedAt;
  if (isNaN(date.getTime())) return new NextResponse("Bad date", { status: 400 });

  const [tx] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        userId: user.id,
        type: b.type,
        title: b.title.trim(),
        sub: typeof b.sub === "string" ? b.sub : "",
        note: typeof b.note === "string" && b.note.length ? b.note : pending.raw,
        cat: b.cat.trim(),
        amount: b.amount,
        date,
        smsHash: pending.smsHash,
      },
    }),
    prisma.pendingSms.delete({ where: { id: pending.id } }),
  ]);
  return NextResponse.json(tx, { status: 201 });
}

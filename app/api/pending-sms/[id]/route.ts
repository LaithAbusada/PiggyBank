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
  const result = await prisma.pendingSms.deleteMany({
    where: { id, userId: user.id },
  });
  if (result.count === 0) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(null, { status: 204 });
}

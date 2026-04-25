import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";
import { generateApiToken } from "@/lib/api-token";

export async function GET() {
  const user = await requireUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  if (user.apiToken) return NextResponse.json({ token: user.apiToken });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { apiToken: generateApiToken() },
  });
  return NextResponse.json({ token: updated.apiToken });
}

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function requireUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (existing) return existing;

  const cu = await currentUser();
  return prisma.user.create({
    data: {
      id: userId,
      email: cu?.emailAddresses?.[0]?.emailAddress ?? null,
    },
  });
}

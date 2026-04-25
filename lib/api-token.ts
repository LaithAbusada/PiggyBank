import { randomBytes } from "crypto";
import { prisma } from "./prisma";

export function generateApiToken(): string {
  return `pb_${randomBytes(32).toString("base64url")}`;
}

export async function userFromBearer(authHeader: string | null) {
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const token = m[1].trim();
  if (!token) return null;
  return prisma.user.findUnique({ where: { apiToken: token } });
}

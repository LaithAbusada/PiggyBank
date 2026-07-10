import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { userFromBearer } from "@/lib/api-token";
import { hashSms, parseSms } from "@/lib/parse-sms";

export async function POST(req: Request) {
  const user = await userFromBearer(req.headers.get("authorization"));
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return new NextResponse("Bad JSON", { status: 400 });

  const { raw, received_at } = body as { raw?: unknown; received_at?: unknown };
  if (typeof raw !== "string" || !raw.trim()) {
    return new NextResponse("Bad raw", { status: 400 });
  }

  const receivedAt = typeof received_at === "string" ? new Date(received_at) : new Date();
  if (isNaN(receivedAt.getTime())) {
    return new NextResponse("Bad received_at", { status: 400 });
  }

  const smsHash = hashSms(raw, receivedAt);

  // Legacy transition shim: rows created before day-bucketed hashing stored
  // sha256(`${raw}|${receivedAt.toISOString()}`). Match either hash in the
  // dupe pre-checks so retries of old rows still dedupe; new rows always get
  // the new hash. Remove once no legacy-hashed rows remain.
  const legacyHash = createHash("sha256")
    .update(`${raw}|${receivedAt.toISOString()}`)
    .digest("hex");

  const [dupeTx, dupePending] = await Promise.all([
    prisma.transaction.findFirst({
      where: { userId: user.id, smsHash: { in: [smsHash, legacyHash] } },
      select: { id: true },
    }),
    prisma.pendingSms.findFirst({
      where: { userId: user.id, smsHash: { in: [smsHash, legacyHash] } },
      select: { id: true },
    }),
  ]);
  if (dupeTx) return NextResponse.json({ status: "duplicate", kind: "transaction", id: dupeTx.id });
  if (dupePending) return NextResponse.json({ status: "duplicate", kind: "pending", id: dupePending.id });

  const parsed = await parseSms(user.id, raw);

  try {
    if (parsed) {
      const tx = await prisma.transaction.create({
        data: {
          userId: user.id,
          type: parsed.type,
          title: parsed.merchant,
          sub: "",
          note: raw,
          cat: parsed.category,
          amount: parsed.type === "in" ? Math.abs(parsed.amount) : -Math.abs(parsed.amount),
          date: receivedAt,
          smsHash,
        },
      });
      return NextResponse.json({ status: "parsed", id: tx.id }, { status: 201 });
    }

    const p = await prisma.pendingSms.create({
      data: { userId: user.id, raw, receivedAt, smsHash },
    });
    return NextResponse.json({ status: "pending", id: p.id }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ status: "duplicate" });
    }
    throw e;
  }
}

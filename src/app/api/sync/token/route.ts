import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: session.userId! },
    select: { syncToken: true },
  });
  return NextResponse.json({ token: user?.syncToken || null });
}

export async function POST() {
  const session = await requireAuth();
  const token = `tt_${randomBytes(24).toString("hex")}`;
  await prisma.user.update({
    where: { id: session.userId! },
    data: { syncToken: token },
  });
  return NextResponse.json({ token });
}
